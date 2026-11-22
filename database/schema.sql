-- =============================================================
-- Shelf & Co. Bookstore Management System
-- File: schema.sql
-- Description: Complete MySQL 8 schema for shelf_and_co database
-- =============================================================

-- Drop and recreate database
DROP DATABASE IF EXISTS shelf_and_co;
CREATE DATABASE shelf_and_co CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shelf_and_co;

-- -------------------------------------------------------------
-- Authors table
-- Stores author biographical information
-- -------------------------------------------------------------
CREATE TABLE Authors (
  author_id   INT          PRIMARY KEY AUTO_INCREMENT,
  author_name VARCHAR(150) NOT NULL,
  biography   TEXT,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------------
-- Categories table
-- Stores book genre / category information
-- -------------------------------------------------------------
CREATE TABLE Categories (
  category_id   INT          PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description   VARCHAR(255)
);

-- -------------------------------------------------------------
-- Books table
-- Core inventory table; references Authors and Categories
-- -------------------------------------------------------------
CREATE TABLE Books (
  book_id          INT            PRIMARY KEY AUTO_INCREMENT,
  isbn             VARCHAR(20)    UNIQUE NOT NULL,
  title            VARCHAR(200)   NOT NULL,
  author_id        INT            NOT NULL,
  category_id      INT            NOT NULL,
  price            DECIMAL(10,2)  NOT NULL CHECK (price > 0),
  stock_quantity   INT            NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  publication_year INT,
  publisher        VARCHAR(150),
  created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id)   REFERENCES Authors(author_id)      ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -------------------------------------------------------------
-- Customers table
-- Stores customer contact and registration details
-- -------------------------------------------------------------
CREATE TABLE Customers (
  customer_id       INT          PRIMARY KEY AUTO_INCREMENT,
  customer_name     VARCHAR(150) NOT NULL,
  email             VARCHAR(150) UNIQUE NOT NULL,
  phone             VARCHAR(15)  UNIQUE NOT NULL,
  address           VARCHAR(255),
  registration_date DATE         DEFAULT (CURRENT_DATE)
);

-- -------------------------------------------------------------
-- Orders table
-- Records each sales transaction; customer_id nullable to allow
-- guest / walk-in orders (SET NULL on customer deletion)
-- -------------------------------------------------------------
CREATE TABLE Orders (
  order_id       INT           PRIMARY KEY AUTO_INCREMENT,
  customer_id    INT,
  order_date     DATETIME      DEFAULT CURRENT_TIMESTAMP,
  total_amount   DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(30)   DEFAULT 'Cash',
  status         VARCHAR(30)   DEFAULT 'Completed',
  FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- -------------------------------------------------------------
-- Order_Items table
-- Line items within each order; cascades on order deletion
-- -------------------------------------------------------------
CREATE TABLE Order_Items (
  order_item_id INT           PRIMARY KEY AUTO_INCREMENT,
  order_id      INT           NOT NULL,
  book_id       INT           NOT NULL,
  quantity      INT           NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  subtotal      DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE   ON UPDATE CASCADE,
  FOREIGN KEY (book_id)  REFERENCES Books(book_id)   ON DELETE RESTRICT  ON UPDATE CASCADE
);

-- -------------------------------------------------------------
-- Indexes for query performance
-- -------------------------------------------------------------
CREATE INDEX idx_books_author      ON Books(author_id);
CREATE INDEX idx_books_category    ON Books(category_id);
CREATE INDEX idx_books_title       ON Books(title);
CREATE INDEX idx_books_isbn        ON Books(isbn);
CREATE INDEX idx_orders_customer   ON Orders(customer_id);
CREATE INDEX idx_orders_date       ON Orders(order_date);
CREATE INDEX idx_order_items_order ON Order_Items(order_id);
CREATE INDEX idx_order_items_book  ON Order_Items(book_id);
CREATE INDEX idx_customers_email   ON Customers(email);
