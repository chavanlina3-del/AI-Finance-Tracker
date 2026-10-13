

CREATE TABLE DEPARTMENT (
 Dept_ID INT PRIMARY KEY
);
CREATE TABLE EMPLOYEE (
 Employee_ID INT PRIMARY KEY,
 Dept_ID INT,
 Employee_Name VARCHAR(50) NOT NULL,
 Salary DECIMAL(10,2) CHECK (Salary > 0),
 Email VARCHAR(100) UNIQUE,
 FOREIGN KEY (Dept_ID) REFERENCES DEPARTMENT(Dept_ID)
);
INSERT INTO DEPARTMENT VALUES
(101), (102), (103);
INSERT INTO EMPLOYEE VALUES
(1, 101, 'Amit', 28000, 'amit@gmail.com'),
(2, 101, 'Priya', 35000, 'priya@gmail.com'),
(3, 102, 'Rahul', 42000, 'rahul@gmail.com'),
(4, 103, 'Sneha', 30000, 'sneha@gmail.com'),
(5, 102, 'Neha', 55000, 'neha@gmail.com');
SELECT * FROM EMPLOYEE
WHERE Salary > 30000;