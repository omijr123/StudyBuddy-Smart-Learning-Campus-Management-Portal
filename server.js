// server.js
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } }); 
const port = 3000;





// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Directories
const uploads = path.join(__dirname, 'uploads');
const chatFolder = path.join(uploads, 'chat');
const contentFolder = path.join(uploads, 'course_content');
[uploads, chatFolder, contentFolder].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);
});
app.use('/uploads', express.static(uploads));
app.use('/content-files', express.static(path.join(__dirname, 'uploads/course_content')));

// DB
const db = mysql.createConnection({
  host: 'localhost', user: 'root', password: 'root', database: 'project', charset: 'utf8mb4'
});
db.connect(err => { if (err) throw err; console.log("✅ MySQL connected"); });

// Socket.io
io.on('connection', socket => {
  console.log("Client connected");
  socket.on('disconnect', () => console.log("Client disconnected"));
});


// Multer Storage Configs
const disk = dest => multer.diskStorage({
  destination: (req, file, cb) => cb(null, dest),
  filename: (req, f, cb) => {
    const ext = path.extname(f.originalname);
    const base = path.basename(f.originalname, ext).replace(/\s+/g, '_');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const uploadProfile = multer({ storage: disk(uploads), fileFilter: (req,f,cb) => cb(null, f.mimetype.startsWith('image/')) });
const uploadChat = multer({ storage: disk(chatFolder) });
const uploadContent = multer({ storage: disk(contentFolder) });
const uploadStationary = multer({ storage: disk(uploads) });
const uploadAnonPost = multer({ storage: disk(uploads) });

const genCode = () => String(Math.floor(Math.random() * 100)).padStart(2, '0');








// --- AUTH ---
// Register
app.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  db.query('INSERT INTO students (name,email,password,balance) VALUES (?,?,?,100)', [name, email, password],
    (e) => e ? res.status(500).send(e) : res.json({ message: 'Registered!' }));
});

// Login
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT id,name,email,profile_image,balance FROM students WHERE email=? AND password=?', [email,password],
    (e, r) => e ? res.status(500).send(e) : r.length ? res.json({ student:r[0] }) : res.status(401).send({ message:'Invalid' }));
});

// Update Profile
app.post('/update-profile', uploadProfile.single('profile_image'), (req, res) => {
  let { id, balance } = req.body;
  let sql, params;
  if (req.file) {
    sql = 'UPDATE students SET balance=?,profile_image=? WHERE id=?';
    params = [balance, `uploads/${req.file.filename}`, id];
  } else {
    sql = 'UPDATE students SET balance=? WHERE id=?'; params = [balance, id];
  }
  db.query(sql, params, err => {
    if (err) return res.status(500).send(err);
    db.query('SELECT id,name,email,profile_image,balance FROM students WHERE id=?', [id], (e, r) => {
      if (e) return res.status(500).send(e);
      res.json({ updatedStudent: r[0] });
    });
  });
});

// --- COURSES ---
// Get All Courses
app.get('/get-courses', (req, res) => {
  db.query('SELECT id, course_name, course_code, duration, balance FROM courses', (e, r) => {
    if (e) {
      return res.status(500).send({ error: 'Database error', details: e });
    }
    res.json(r);  // Sends the courses to the frontend
  });
});



// Add Course
app.post('/add-course', (req, res) => {
  const { course_name, course_code, duration, balance } = req.body;
  db.query('INSERT INTO courses (course_name,course_code,duration,balance) VALUES (?,?,?,?)',
    [course_name, course_code, duration, balance],
    e => e ? res.status(500).send(e) : res.send('Course added'));
});
app.post('/update-course', (req, res) => {
  const { old_course_code, new_course_name, new_duration, new_balance } = req.body;
  const sql = 'UPDATE courses SET course_name = ?, duration = ?, balance = ? WHERE course_code = ?';
  db.query(sql, [new_course_name, new_duration, new_balance, old_course_code], (err, result) => {
    if (err) {
      console.error('Error updating course:', err);
      return res.status(500).send('Error updating course.');
    }
    if (result.affectedRows === 0) {
      return res.send('Course not found.');
    }
    res.send('Course updated successfully!');
  });
});

app.post('/delete-course', (req, res) => {
  const { delete_course_code } = req.body;
  const sql = 'DELETE FROM courses WHERE course_code = ?';
  db.query(sql, [delete_course_code], (err, result) => {
    if (err) {
      console.error('Error deleting course:', err);
      return res.status(500).send('Error deleting course.');
    }
    if (result.affectedRows === 0) {
      return res.send('Course not found.');
    }
    res.send('Course deleted successfully!');
  });
});
// --- COURSE PURCHASE ---
// Buy Course
// Buy Course
app.post('/buy-course', (req, res) => {
  const { student_id, course_id } = req.body;

  // Check if the student has sufficient balance to purchase the course
  db.query('SELECT balance FROM students WHERE id=?', [student_id], (e1, r1) => {
    if (e1 || !r1.length) return res.status(400).json({ message: 'Invalid student' });

    const studentBalance = parseFloat(r1[0].balance);

    // Check the course fee
    db.query('SELECT balance FROM courses WHERE id=?', [course_id], (e2, r2) => {
      if (e2 || !r2.length) return res.status(400).json({ message: 'Invalid course' });
      
      const courseFee = parseFloat(r2[0].balance);
      
      // Check if the student has enough balance
      if (studentBalance < courseFee) return res.json({ success: false, message: 'Insufficient balance' });

      // Check if the student has already purchased the course
      db.query('SELECT * FROM student_courses WHERE student_id=? AND course_id=?', [student_id, course_id], (e3, r3) => {
        if (e3) return res.status(500).send(e3);
        if (r3.length) return res.json({ message: 'Already purchased' });

        // Deduct the course fee from the student's balance
        db.query('UPDATE students SET balance = balance - ? WHERE id=?', [courseFee, student_id], (e4) => {
          if (e4) return res.status(500).send(e4);

          // Add the course to the student's enrollment
          db.query('INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)', [student_id, course_id], (e5) => {
            if (e5) return res.status(500).send(e5);

            // Get the updated balance of the student
            db.query('SELECT balance FROM students WHERE id=?', [student_id], (e6, r6) => {
              if (e6) return res.status(500).send(e6);
              res.json({ success: true, updatedBalance: r6[0].balance });
            });
          });
        });
      });
    });
  });
});



// Get Student's Purchased Courses
app.get('/get-my-courses', (req, res) => {
  const studentId = req.query.student_id;  // Ensure student_id is sent as a query parameter
  
  // Ensure student_id is provided
  if (!studentId) return res.status(400).json({ message: "Student ID is required" });

  // SQL query to fetch the courses the student is enrolled in
  const sql = `
    SELECT c.id, c.course_name, c.course_code, c.duration, c.balance
    FROM courses c
    JOIN student_courses sc ON sc.course_id = c.id
    WHERE sc.student_id = ?
  `;

  db.query(sql, [studentId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: 'Database error', details: err });
    }
    res.json(results);  // Respond with the enrolled courses
  });
});


// --- CONTENT MANAGEMENT ---

// --- CONTENT MANAGEMENT --- ✅ CHANGES HERE
app.post('/upload-content', uploadContent.single('content_file'), (req, res) => {
  const { title, course } = req.body;
  const filePath = `uploads/course_content/${req.file.filename}`;

  db.query('INSERT INTO contents (title, course, filename, filepath) VALUES (?, ?, ?, ?)', 
    [title, course, req.file.originalname, filePath], 
    (err) => {
      if (err) return res.status(500).send('Error uploading content');
      res.send('Content uploaded successfully');
    });
});

app.get('/get-contents', (req, res) => {
  db.query('SELECT * FROM contents', (err, results) => {
    if (err) return res.status(500).send('Database error');
    res.json(results);
  });
});

app.post('/update-full-content', uploadContent.single('content_file'), (req, res) => {
  const { id, title, course } = req.body;
  if (req.file) {
    db.query('SELECT filepath FROM contents WHERE id=?', [id], (e, r) => {
      if (!e && r.length) fs.unlink(r[0].filepath, () => {});
      const newPath = `uploads/course_content/${req.file.filename}`;
      db.query('UPDATE contents SET title=?, course=?, filename=?, filepath=? WHERE id=?',
        [title, course, req.file.originalname, newPath, id],
        e2 => e2 ? res.status(500).send(e2) : res.send('Updated with file'));
    });
  } else {
    db.query('UPDATE contents SET title=?, course=? WHERE id=?', [title, course, id],
      e => e ? res.status(500).send(e) : res.send('Metadata updated'));
  }
});

app.get('/student-contents/:student_id', (req, res) => {
  const studentId = req.params.student_id;
  const sql = `
    SELECT c.title, c.filename, c.filepath, c.uploaded_at, co.course_name
    FROM contents c
    JOIN courses co ON c.course COLLATE utf8mb4_unicode_ci = co.course_code COLLATE utf8mb4_unicode_ci
    JOIN student_courses sc ON sc.course_id = co.id
    WHERE sc.student_id = ?
    ORDER BY c.uploaded_at DESC
  `;
  db.query(sql, [studentId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error', details: err });
    res.json(results);
  });
});

app.delete('/delete-content/:id', (req, res) => {
  const contentId = req.params.id;
  db.query('SELECT filepath FROM contents WHERE id = ?', [contentId], (err, result) => {
    if (err || !result.length) return res.status(404).send('Content not found');
    const filePath = result[0].filepath;
    const absoluteFilePath = path.join(__dirname, filePath);
    fs.access(absoluteFilePath, fs.constants.F_OK, (err) => {
      if (err) return res.status(404).send('File not found');
      fs.unlink(absoluteFilePath, (err) => {
        if (err) return res.status(500).send('Error deleting file');
        db.query('DELETE FROM contents WHERE id = ?', [contentId], (err) => {
          if (err) return res.status(500).send('Error deleting content from database');
          res.send('Content and file deleted successfully');
        });
      });
    });
  });
});

app.get('/download-content/:id',(req,res)=>{
  db.query('SELECT filename,filepath FROM contents WHERE id=?',[req.params.id],(e,r)=>{
    if(e||!r.length) return res.status(404).send(e||'Not found');
    res.download(r[0].filepath, r[0].filename);
  });
});

// --- NOTICES ---
// Get Notices
app.get('/get-notices', (req,res)=>{
  db.query('SELECT title,details FROM notices', (e,r)=> e?res.status(500).send(e):res.json(r));
});

// Post Notice
app.post('/post-notice',(req,res)=>{
  db.query('INSERT INTO notices (title,details) VALUES (?,?)',[req.body.title,req.body.details],e=> e?res.status(500).send(e):res.send('Posted'));
});

// Update Notice
app.post('/update-notice',(req,res)=>{
  db.query('UPDATE notices SET details=? WHERE title=?',[req.body.details,req.body.title], (e,r)=> e?res.status(500).send(e):res.send(r.affectedRows?'Updated':'Not found'));
});

// Delete Notice
app.post('/delete-notice',(req,res)=>{
  db.query('DELETE FROM notices WHERE title=?',[req.body.titleToDelete], (e,r)=> e?res.status(500).send(e):res.send(r.affectedRows?'Deleted':'Not found'));
});

// --- GROUP CHAT ---
// Get Messages
app.get('/messages',(req,res)=>{
  db.query(`SELECT gc.id,gc.student_id,s.name,gc.message,gc.file_url,gc.timestamp,gc.edited,gc.is_deleted,gc.deleted_by
            FROM group_chat gc JOIN students s ON gc.student_id=s.id
            ORDER BY gc.timestamp`, (e,r)=> e?res.status(500).send(e):res.json(r));
});

// Send Message
app.post('/send', uploadChat.single('file'), (req,res)=>{
  const { student_id, message } = req.body;
  const file_url = req.file ? `uploads/chat/${req.file.filename}` : null;
  db.query('INSERT INTO group_chat (student_id,message,file_url) VALUES(?,?,?)',
    [student_id,message,file_url],
    (e,r)=> {
      if (e) return res.status(500).send(e);
      db.query('SELECT name FROM students WHERE id=?',[student_id],(e2,rows)=>{
        const msg = { id:r.insertId,student_id,name:rows[0].name,message,file_url,edited:false,is_deleted:false,timestamp: new Date() };
        io.emit('newMessage', msg);
        res.json(msg);
      });
    });
});

// Edit Message
app.post('/edit-message',(req,res)=>{
  const { id, message } = req.body;
  db.query('UPDATE group_chat SET message=?,edited=1 WHERE id=?',[message,id], e=>{
    if(e) return res.status(500).send(e);
    io.emit('editMessage',{id,message});
    res.send('Edited');
  });
});

// Delete Message
app.post('/delete-message',(req,res)=>{
  const { id, deleted_by } = req.body;
  db.query('UPDATE group_chat SET is_deleted=1,deleted_by=? WHERE id=?',[deleted_by,id], e=>{
    if(e) return res.status(500).send(e);
    io.emit('deleteMessage',{id});
    res.send('Deleted');
  });
});

// --- STATIONARY SHOP ---
// Add Stationary
app.post('/add-stationary', uploadStationary.single('image'), (req,res)=>{
  const { item_name, price, quantity } = req.body;
  const img = fs.readFileSync(req.file.path);
  db.query('INSERT INTO stationary_items (item_name,price,quantity,image_name,image_data) VALUES(?,?,?,?,?)',
    [item_name, price, quantity, req.file.filename, img], e=> e ? res.status(500).send(e) : res.send('Added'));
});
app.delete('/delete-stationary/:id', (req, res) => {
  const { id } = req.params;

  // Step 1: Delete all purchases of this item
  db.query('DELETE FROM purchases WHERE item_id = ?', [id], (err1) => {
    if (err1) {
      console.error('Failed to delete dependent purchases:', err1);
      return res.status(500).send('Failed to delete related purchases');
    }

    // Step 2: Now delete the stationary item
    db.query('DELETE FROM stationary_items WHERE id = ?', [id], (err2) => {
      if (err2) {
        console.error('Delete error:', err2);
        return res.status(500).send('Failed to delete item');
      }
      res.send('Item and related purchases deleted successfully');
    });
  });
});




app.post('/update-stationary', multer({ storage: disk(uploads) }).single('image'), (req, res) => {
  const { id, item_name, quantity, price } = req.body;
  const file = req.file;

  let sql, params;
  if (file) {
    sql = 'UPDATE stationary_items SET item_name = ?, quantity = ?, price = ?, image_name = ?, image_data = ? WHERE id = ?';
    params = [item_name, quantity, price, file.originalname, file.buffer, id];
  } else {
    sql = 'UPDATE stationary_items SET item_name = ?, quantity = ?, price = ? WHERE id = ?';
    params = [item_name, quantity, price, id];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Update error:', err);
      return res.status(500).send('Failed to update item');
    }
    res.send('Item updated successfully');
  });
});

// Get Stationary
app.get('/get-stationary', (req,res)=>{
  db.query('SELECT id,item_name,price,quantity,image_data FROM stationary_items', (e,r)=>{
    if(e) return res.status(500).send(e);
    const data = r.map(x=>({
      id: x.id, item_name: x.item_name, price: x.price, quantity: x.quantity,
      image_base64: x.image_data ? x.image_data.toString('base64') : ''
    }));
    res.json(data);
  });
});

// Buy Stationary
app.post('/buy-stationary', (req,res)=>{
  const { student_id, item_id } = req.body;
  db.query('SELECT quantity,price FROM stationary_items WHERE id=?',[item_id],(e1,r1)=>{
    if(e1||!r1.length) return res.status(400).send('Invalid');
    const { quantity, price } = r1[0];
    if(quantity < 1) return res.json({ message:'Out of stock' });
    db.query('SELECT balance FROM students WHERE id=?',[student_id],(e2,r2)=>{
      if(e2||!r2.length) return res.status(400).send('Invalid');
      const bal = parseFloat(r2[0].balance);
      if(bal < price) return res.json({ message:'Insufficient balance' });
      db.query('UPDATE stationary_items SET quantity = quantity -1 WHERE id=?',[item_id],(e3)=>{
        if(e3) return res.status(500).send(e3);
        db.query('UPDATE students SET balance = balance - ? WHERE id=?',[price,student_id],(e4)=>{
          if(e4) return res.status(500).send(e4);
          db.query('INSERT INTO purchases (student_id,item_id) VALUES(?,?)',[student_id,item_id],(e5)=>{
            if(e5) return res.status(500).send(e5);
            db.query('SELECT balance FROM students WHERE id=?',[student_id],(e6,r6)=>{
              if(e6) return res.status(500).send(e6);
              res.json({ success:true, updatedBalance:r6[0].balance });
            });
          });
        });
      });
    });
  });
});

// Get Stationary Purchases
app.get('/get-my-stationary', (req,res)=>{
  const sid = req.query.student_id;
  db.query(`SELECT s.item_name,s.price,s.image_data,p.purchase_date
            FROM purchases p JOIN stationary_items s ON p.item_id=s.id
            WHERE p.student_id=? ORDER BY p.purchase_date DESC`, [sid],
    (e,r)=>{
      if(e) return res.status(500).send(e);
      res.json(r.map(x=>({
        item_name:x.item_name, price:x.price,
        image_base64: x.image_data ? x.image_data.toString('base64') : '',
        purchase_date: x.purchase_date
      })));
    });
});



app.post('/add-question', (req, res) => {
  console.log("Incoming question data:", req.body);  // ✅ log request body

  const { course_id, question, option_a, option_b, option_c, option_d, correct_option } = req.body;

  const sql = `INSERT INTO mcq_questions (course_id, question, option_a, option_b, option_c, option_d, correct_option) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`;

  db.query(sql, [course_id, question, option_a, option_b, option_c, option_d, correct_option], (err, result) => {
    if (err) {
      console.error("Insert error:", err); // ✅ Log DB error
      return res.status(500).send({ error: 'Database error', details: err });
    }
    res.json({ message: 'Question added successfully!' });
  });
});


app.get('/questions/:course_id', (req, res) => {
  const courseId = req.params.course_id;

  const sql = `SELECT * FROM mcq_questions WHERE course_id = ?`;

  db.query(sql, [courseId], (err, result) => {
    if (err) return res.status(500).send({ error: 'Database error', details: err });
    res.json(result);
  });
});


app.post('/update-question', (req, res) => {
  const { id, course_id, question, option_a, option_b, option_c, option_d, correct_option } = req.body;

  const sql = `UPDATE mcq_questions 
               SET course_id = ?, question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, correct_option = ? 
               WHERE id = ?`;

  db.query(sql, [course_id, question, option_a, option_b, option_c, option_d, correct_option, id], (err, result) => {
    if (err) return res.status(500).send({ error: 'Database error', details: err });
    res.json({ message: 'Question updated successfully!' });
  });
});


app.delete('/delete-question/:id', (req, res) => {
  const id = req.params.id;

  const sql = `DELETE FROM mcq_questions WHERE id = ?`;

  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send({ error: 'Database error', details: err });
    res.json({ message: 'Question deleted successfully!' });
  });
});

app.post('/save-exam-score', (req, res) => {
  const { student_id, course_id, total, correct } = req.body;

  const sql = `
    INSERT INTO exam_scores (student_id, course_id, total_questions, correct_answers, taken_at)
    VALUES (?, ?, ?, ?, NOW())
  `;

  db.query(sql, [student_id, course_id, total, correct], (err) => {
    if (err) return res.status(500).send({ message: 'Failed to save score', error: err });
    res.send({ message: 'Score saved successfully' });
  });
});
app.post('/save-result', (req, res) => {
  const { student_id, course_id, score } = req.body;
  if (!student_id || !course_id || !score) {
    return res.status(400).json({ error: "Missing data" });
  }

  const sql = "INSERT INTO exam_results (student_id, course_id, score) VALUES (?, ?, ?)";
  db.query(sql, [student_id, course_id, score], (err) => {
    if (err) {
      console.error("Error saving result:", err);
      return res.status(500).json({ error: "Failed to save result" });
    }
    res.json({ success: true });
  });
});
app.get('/questions/:courseId', (req, res) => {
  const courseId = req.params.courseId;
  db.query('SELECT * FROM questions WHERE course_id = ?', [courseId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});







app.post('/post', uploadAnonPost.single('image'), (req, res) => {
  const { name, content } = req.body;
  if (!name || !content) return res.status(400).json({ error: 'Name & content required' });
  const img = req.file ? '/uploads/' + req.file.filename : null;
  const code = genCode();
  db.query(
    'INSERT INTO anon_posts (display_name, content, image_path, delete_code) VALUES (?,?,?,?)',
    [name, content, img, code],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json({ message: 'Posted', delete_code: code, post_id: result.insertId });
    }
  );
});

// Edit Post
app.put('/post/:id', (req, res) => {
  const { code, new_content } = req.body;
  if (!code || !new_content) return res.status(400).json({ error: 'Need code & new_content' });
  db.query(
    'UPDATE anon_posts SET content=? WHERE id=? AND delete_code=?',
    [new_content, req.params.id, code],
    (_e, r) =>
      r.affectedRows
        ? res.json({ message: 'Post edited' })
        : res.status(403).json({ error: 'Wrong code / post' })
  );
});

// Delete Post
app.delete('/post/:id', (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Need code' });
  db.query(
    'DELETE FROM anon_posts WHERE id=? AND delete_code=?',
    [req.params.id, code],
    (_e, r) =>
      r.affectedRows
        ? res.json({ message: 'Post deleted' })
        : res.status(403).json({ error: 'Wrong code / post' })
  );
});

// Get All Posts
app.get('/posts', (_req, res) => {
  db.query(
    `SELECT p.*, 
            (SELECT COUNT(*) FROM anon_likes l WHERE l.post_id = p.id) AS likes,
            (SELECT GROUP_CONCAT(liker_name SEPARATOR ', ') FROM anon_likes l WHERE l.post_id = p.id) AS liker_list
     FROM anon_posts p ORDER BY p.id DESC`,
    (_e, rows) => res.json(rows)
  );
});

// Like Post (multiple likes per person allowed)
app.post('/like', (req, res) => {
  const { post_id, liker_name } = req.body;
  if (!post_id || !liker_name) return res.status(400).json({ error: 'Need post_id & liker_name' });
  db.query(
    'INSERT INTO anon_likes (post_id, liker_name) VALUES (?,?)',
    [post_id, liker_name],
    () => res.json({ message: 'Like stored' })
  );
});

// Add Comment
app.post('/comment', (req, res) => {
  const { post_id, commenter_name, comment } = req.body;
  if (!post_id || !commenter_name || !comment) return res.status(400).json({ error: 'Missing fields' });
  const code = genCode();
  db.query(
    'INSERT INTO anon_comments (post_id, commenter_name, comment, edit_code) VALUES (?,?,?,?)',
    [post_id, commenter_name, comment, code],
    (_e, result) => res.json({ message: 'Comment added', edit_code: code, comment_id: result.insertId })
  );
});

// List Comments by Post
app.get('/comments/:post', (req, res) => {
  db.query(
    'SELECT id, commenter_name, comment FROM anon_comments WHERE post_id=? ORDER BY id ASC',
    [req.params.post],
    (_e, rows) => res.json(rows)
  );
});

// Edit Comment
app.put('/comment/:id', (req, res) => {
  const { code, new_text } = req.body;
  if (!code || !new_text) return res.status(400).json({ error: 'Need code & new_text' });
  db.query(
    'UPDATE anon_comments SET comment=? WHERE id=? AND edit_code=?',
    [new_text, req.params.id, code],
    (_e, r) =>
      r.affectedRows
        ? res.json({ message: 'Comment edited' })
        : res.status(403).json({ error: 'Wrong code / comment' })
  );
});

// Delete Comment
app.delete('/comment/:id', (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'Need code' });
  db.query(
    'DELETE FROM anon_comments WHERE id=? AND edit_code=?',
    [req.params.id, code],
    (_e, r) =>
      r.affectedRows
        ? res.json({ message: 'Comment deleted' })
        : res.status(403).json({ error: 'Wrong code / comment' })
  );
});









// Start
server.listen(port, () => console.log(`⚙️  Server running on http://localhost:${port}`));
