CREATE DATABASE IF NOT EXISTS project;
USE project;

CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_name VARCHAR(255),
  course_code VARCHAR(50) UNIQUE,
  duration INT,
  balance DECIMAL(10, 2)
);

CREATE TABLE IF NOT EXISTS contents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255),
  course INT,
  filename VARCHAR(255),
  filedata LONGBLOB,
  FOREIGN KEY (course) REFERENCES courses(id)
);

INSERT INTO courses (course_name, course_code, duration, balance)
VALUES 
  ('Web Development', 'WD101', 12, 3000.00),
  ('Database Systems', 'DB102', 10, 2800.00);
