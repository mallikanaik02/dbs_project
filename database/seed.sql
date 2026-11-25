-- =============================================================
-- Shelf & Co. Bookstore Management System
-- File: seed.sql
-- Description: Realistic seed data for shelf_and_co database.
--              INSERT IGNORE prevents duplicate-key errors on re-run.
--              Book_Authors (M:N junction) includes co-authorship examples.
-- =============================================================

USE shelf_and_co;

-- -------------------------------------------------------------
-- 1. AUTHORS  (10 literary authors)
-- -------------------------------------------------------------
INSERT IGNORE INTO Authors (author_id, author_name, biography) VALUES
(1,  'George Orwell',
     'Eric Arthur Blair, known by his pen name George Orwell, was an English novelist, essayist, journalist and critic. His work is characterised by lucid prose, biting social criticism, opposition to totalitarianism, and outright support of democratic socialism.'),
(2,  'Toni Morrison',
     'Toni Morrison was an American novelist, essayist, book editor, and college professor. Her first novel, The Bluest Eye, was published in 1970. The critically acclaimed Song of Solomon brought her national attention and won the National Book Critics Circle Award.'),
(3,  'Gabriel Garcia Marquez',
     'Gabriel Jose de la Concordia Garcia Marquez was a Colombian novelist, short-story writer, screenwriter, and journalist, known affectionately as Gabo throughout Latin America. Considered one of the most significant authors of the 20th century, he was awarded the 1972 Neustadt International Prize for Literature and the 1982 Nobel Prize in Literature.'),
(4,  'Haruki Murakami',
     'Haruki Murakami is a Japanese writer. His novels, essays, and short stories have been bestsellers in Japan as well as internationally, with his work translated into 50 languages and selling millions of copies outside his native country.'),
(5,  'Agatha Christie',
     'Dame Agatha Mary Clarissa Christie, Lady Mallowan, was an English writer known for her 66 detective novels and 14 short story collections, particularly those revolving around fictional detectives Hercule Poirot and Miss Marple.'),
(6,  'J.K. Rowling',
     'Joanne Rowling, writing under the pen names J. K. Rowling and Robert Galbraith, is a British author best known for writing the Harry Potter fantasy series. The books have won multiple awards and sold more than 500 million copies.'),
(7,  'Stephen King',
     'Stephen Edwin King is an American author of horror, supernatural fiction, suspense, crime, science-fiction, and fantasy novels. Described as the King of Horror, his books have sold more than 350 million copies.'),
(8,  'Paulo Coelho',
     'Paulo Coelho de Souza is a Brazilian lyricist and novelist, best known for his novel The Alchemist. In 2014, he uploaded his personal papers online to create a virtual Paulo Coelho Foundation.'),
(9,  'Chimamanda Ngozi Adichie',
     'Chimamanda Ngozi Adichie is a Nigerian author whose works range from novels to short stories to nonfiction. She was described in The Times Literary Supplement as the most prominent of a procession of critically acclaimed young anglophone authors.'),
(10, 'Neil Gaiman',
     'Neil Richard MacKinnon Gaiman is an English author of short fiction, novels, comic books, graphic novels, nonfiction, audio theatre, and films. His notable works include the comic book series The Sandman and novels Stardust, American Gods, Coraline, and Good Omens.');

-- -------------------------------------------------------------
-- 2. CATEGORIES  (8 genres)
-- -------------------------------------------------------------
INSERT IGNORE INTO Categories (category_id, category_name, description) VALUES
(1, 'Fiction',         'Literary fiction and contemporary novels exploring the human condition.'),
(2, 'Mystery',         'Detective stories, crime fiction, and whodunit novels.'),
(3, 'Fantasy',         'Stories set in magical or supernatural worlds, including epic fantasy.'),
(4, 'Romance',         'Stories centered on love and romantic relationships with an emotionally satisfying ending.'),
(5, 'Science Fiction', 'Speculative fiction dealing with futuristic concepts, technology, and space exploration.'),
(6, 'Non-fiction',     'Factual accounts including memoirs, biographies, and essays.'),
(7, 'Psychology',      'Books on human behaviour, mental health, cognition, and self-improvement.'),
(8, 'History',         'Historical accounts, biographies of historical figures, and historical analysis.');

-- -------------------------------------------------------------
-- 3. BOOKS  (25 books spread across categories)
--    NOTE: author_id column REMOVED — authors linked via Book_Authors
--    ISBNs: 978-XXXXXXXXXX format
--    Prices: $8–$35; stock includes low stock (1–3) and out-of-stock (0)
-- -------------------------------------------------------------
INSERT IGNORE INTO Books (book_id, isbn, title, category_id, price, stock_quantity, publication_year, publisher) VALUES
-- George Orwell — Fiction & Non-fiction
(1,  '978-0451524935', 'Nineteen Eighty-Four',                    1, 12.99, 45, 1949, 'Signet Classic'),
(2,  '978-0452284241', 'Animal Farm',                             1,  9.99, 60, 1945, 'Plume'),
(3,  '978-0547249643', 'Homage to Catalonia',                     6, 14.99,  3, 1938, 'Mariner Books'),

-- Toni Morrison — Fiction
(4,  '978-1400033416', 'Beloved',                                 1, 15.99, 28, 1987, 'Vintage'),
(5,  '978-0307740922', 'Song of Solomon',                         1, 14.99, 20, 1977, 'Vintage'),
(6,  '978-0307388384', 'The Bluest Eye',                          1, 11.99,  2, 1970, 'Vintage'),

-- Gabriel Garcia Marquez — Fiction
(7,  '978-0060883287', 'One Hundred Years of Solitude',           1, 16.99, 35, 1967, 'Harper Perennial'),
(8,  '978-0140157239', 'Love in the Time of Cholera',             1, 15.99, 18, 1985, 'Penguin Books'),

-- Haruki Murakami — Fiction
(9,  '978-0375704024', 'Norwegian Wood',                          1, 13.99, 40, 1987, 'Vintage'),
(10, '978-0307593313', 'Kafka on the Shore',                      1, 17.99, 22, 2002, 'Vintage'),
(11, '978-0679745402', 'The Wind-Up Bird Chronicle',              1, 18.99,  1, 1994, 'Vintage'),

-- Agatha Christie — Mystery
(12, '978-0062073501', 'Murder on the Orient Express',            2, 10.99, 55, 1934, 'William Morrow'),
(13, '978-0062073556', 'And Then There Were None',                2,  9.99, 70, 1939, 'William Morrow'),
(14, '978-0062073594', 'The ABC Murders',                         2, 11.99, 15, 1936, 'William Morrow'),

-- J.K. Rowling — Fantasy
(15, '978-0590353427', 'Harry Potter and the Philosophers Stone', 3, 10.99, 80, 1997, 'Scholastic'),
(16, '978-0439064873', 'Harry Potter and the Chamber of Secrets', 3, 11.99, 65, 1998, 'Scholastic'),
(17, '978-0439136365', 'Harry Potter and the Prisoner of Azkaban',3, 12.99, 50, 1999, 'Scholastic'),

-- Stephen King — Fantasy / Horror
(18, '978-0307743657', 'The Shining',                             3, 14.99, 38, 1977, 'Anchor'),
(19, '978-1501156700', 'It',                                      3, 19.99,  0, 1986, 'Scribner'),
(20, '978-0385333481', 'Pet Sematary',                            3, 13.99,  5, 1983, 'Anchor'),

-- Paulo Coelho — Fiction
(21, '978-0062315007', 'The Alchemist',                           1, 11.99, 90, 1988, 'HarperOne'),
(22, '978-0061997846', 'The Zahir',                               1, 13.99, 12, 2005, 'HarperOne'),

-- Chimamanda Ngozi Adichie — History & Fiction
(23, '978-1400095209', 'Half of a Yellow Sun',                    8, 16.99, 25, 2006, 'Anchor'),
(24, '978-0307455925', 'Purple Hibiscus',                         1, 12.99,  0, 2003, 'Anchor'),

-- Neil Gaiman — Fantasy  (Good Omens: co-authored with Terry Pratchett — stored as author 10 Lead, demo of M:N)
(25, '978-0062059888', 'American Gods',                           3, 17.99, 33, 2001, 'William Morrow');

-- -------------------------------------------------------------
-- 4. BOOK_AUTHORS  (M:N junction — links books to their authors)
--    Most books have one author; "Good Omens" style co-authorship
--    is demonstrated for academic / viva purposes using existing
--    seed authors so no extra author rows are needed.
-- -------------------------------------------------------------
INSERT IGNORE INTO Book_Authors (book_id, author_id, author_role) VALUES
-- George Orwell books (author 1)
(1,  1, 'Author'),   -- Nineteen Eighty-Four
(2,  1, 'Author'),   -- Animal Farm
(3,  1, 'Author'),   -- Homage to Catalonia

-- Toni Morrison books (author 2)
(4,  2, 'Author'),   -- Beloved
(5,  2, 'Author'),   -- Song of Solomon
(6,  2, 'Author'),   -- The Bluest Eye

-- Gabriel Garcia Marquez books (author 3)
(7,  3, 'Author'),   -- One Hundred Years of Solitude
(8,  3, 'Author'),   -- Love in the Time of Cholera

-- Haruki Murakami books (author 4)
(9,  4, 'Author'),   -- Norwegian Wood
(10, 4, 'Author'),   -- Kafka on the Shore
(11, 4, 'Author'),   -- The Wind-Up Bird Chronicle

-- Agatha Christie books (author 5)
(12, 5, 'Author'),   -- Murder on the Orient Express
(13, 5, 'Author'),   -- And Then There Were None
(14, 5, 'Author'),   -- The ABC Murders

-- J.K. Rowling books (author 6)
(15, 6, 'Author'),   -- HP: Philosopher's Stone
(16, 6, 'Author'),   -- HP: Chamber of Secrets
(17, 6, 'Author'),   -- HP: Prisoner of Azkaban

-- Stephen King books (author 7)
(18, 7, 'Author'),   -- The Shining
(19, 7, 'Author'),   -- It
(20, 7, 'Author'),   -- Pet Sematary

-- Paulo Coelho books (author 8)
(21, 8, 'Author'),   -- The Alchemist
(22, 8, 'Author'),   -- The Zahir

-- Chimamanda Ngozi Adichie books (author 9)
(23, 9, 'Author'),   -- Half of a Yellow Sun
(24, 9, 'Author'),   -- Purple Hibiscus

-- Neil Gaiman — American Gods (author 10, sole author)
(25, 10, 'Author'),  -- American Gods

-- *** CO-AUTHORSHIP DEMONSTRATION (M:N feature) ***
-- "One Hundred Years of Solitude" (book 7) is also credited to
-- Neil Gaiman (author 10) as 'Co-Author' for viva demonstration
-- purposes — showing a book with two authors in Book_Authors.
(7,  10, 'Co-Author');

-- -------------------------------------------------------------
-- 5. CUSTOMERS  (15 customers with varied registration dates)
-- -------------------------------------------------------------
INSERT IGNORE INTO Customers (customer_id, customer_name, email, phone, address, registration_date) VALUES
(1,  'Aarav Sharma',      'aarav.sharma@gmail.com',      '9876543210', '14 MG Road, Bengaluru, Karnataka 560001',          '2025-01-15'),
(2,  'Priya Nair',        'priya.nair@outlook.com',      '9812345678', '22 Anna Salai, Chennai, Tamil Nadu 600002',         '2025-02-03'),
(3,  'Rohan Mehta',       'rohan.mehta@yahoo.com',       '9823456789', '5 Linking Road, Mumbai, Maharashtra 400050',        '2025-02-20'),
(4,  'Sneha Iyer',        'sneha.iyer@hotmail.com',      '9834567890', '78 Jubilee Hills, Hyderabad, Telangana 500033',     '2025-03-08'),
(5,  'Vikram Patel',      'vikram.patel@gmail.com',      '9845678901', '33 Ashram Road, Ahmedabad, Gujarat 380009',         '2025-03-25'),
(6,  'Anjali Reddy',      'anjali.reddy@gmail.com',      '9856789012', '10 Banjara Hills, Hyderabad, Telangana 500034',     '2025-04-10'),
(7,  'Karan Singh',       'karan.singh@outlook.com',     '9867890123', '45 Connaught Place, New Delhi 110001',              '2025-04-22'),
(8,  'Meera Krishnan',    'meera.krishnan@gmail.com',    '9878901234', '7 Kalakshetra Road, Chennai, Tamil Nadu 600090',    '2025-05-05'),
(9,  'Arjun Desai',       'arjun.desai@yahoo.com',       '9889012345', '19 FC Road, Pune, Maharashtra 411004',              '2025-05-18'),
(10, 'Divya Pillai',      'divya.pillai@gmail.com',      '9890123456', '55 MG Road, Kochi, Kerala 682035',                  '2025-06-02'),
(11, 'Rahul Gupta',       'rahul.gupta@outlook.com',     '9801234567', '88 Hazratganj, Lucknow, Uttar Pradesh 226001',      '2025-06-20'),
(12, 'Nisha Joshi',       'nisha.joshi@gmail.com',       '9712345678', '12 Civil Lines, Jaipur, Rajasthan 302006',          '2025-07-07'),
(13, 'Siddharth Rao',     'siddharth.rao@hotmail.com',   '9723456789', '3 Residency Road, Bengaluru, Karnataka 560025',     '2025-07-28'),
(14, 'Kavya Menon',       'kavya.menon@gmail.com',       '9734567890', '99 Marine Drive, Mumbai, Maharashtra 400020',       '2025-08-14'),
(15, 'Aditya Verma',      'aditya.verma@outlook.com',    '9745678901', '17 Sector 18, Noida, Uttar Pradesh 201301',         '2025-09-01');

-- -------------------------------------------------------------
-- 6. ORDERS  (22 orders across Nov 2025 – Nov 2026)
-- -------------------------------------------------------------
INSERT IGNORE INTO Orders (order_id, customer_id, order_date, total_amount, payment_method, status) VALUES
(1,   3, '2025-11-05 10:30:00',  41.97, 'Credit Card', 'Completed'),
(2,   7, '2025-12-10 14:00:00',  40.96, 'UPI',         'Completed'),
(3,   1, '2025-12-18 11:00:00',  51.96, 'Debit Card',  'Completed'),
(4,   5, '2026-01-07 09:30:00',  21.98, 'Cash',        'Completed'),
(5,   9, '2026-01-14 16:00:00',  49.97, 'Credit Card', 'Completed'),
(6,   2, '2026-01-22 13:00:00',  15.99, 'UPI',         'Completed'),
(7,   4, '2026-02-03 10:00:00',  37.97, 'Cash',        'Completed'),
(8,  11, '2026-02-11 15:30:00',  22.98, 'Credit Card', 'Completed'),
(9,   6, '2026-02-19 12:00:00',  52.97, 'Debit Card',  'Completed'),
(10,  8, '2026-03-04 09:00:00',  43.96, 'UPI',         'Completed'),
(11,  1, '2026-03-15 11:30:00',  61.96, 'Credit Card', 'Completed'),
(12, 13, '2026-04-01 14:00:00',  19.99, 'Cash',        'Completed'),
(13,  3, '2026-04-20 10:30:00',  38.97, 'UPI',         'Completed'),
(14, 10, '2026-04-28 16:00:00',  56.96, 'Credit Card', 'Completed'),
(15, 12, '2026-05-10 11:00:00',  22.98, 'Cash',        'Completed'),
(16,  7, '2026-05-20 15:00:00',  51.97, 'Debit Card',  'Completed'),
(17,  2, '2026-06-02 10:30:00',  16.99, 'UPI',         'Completed'),
(18, 14, '2026-07-10 09:00:00',  38.97, 'Credit Card', 'Completed'),
(19,  5, '2026-08-05 14:15:00',  12.99, 'Cash',        'Cancelled'),
(20,  9, '2026-09-11 11:00:00',  33.97, 'UPI',         'Completed'),
(21, 15, '2026-10-04 16:00:00',  49.97, 'Credit Card', 'Completed'),
(22,  6, '2026-11-01 13:30:00',  18.99, 'Cash',        'Cancelled');

-- -------------------------------------------------------------
-- 7. ORDER_ITEMS  (multiple line items per order)
-- -------------------------------------------------------------
INSERT IGNORE INTO Order_Items (order_item_id, order_id, book_id, quantity, unit_price, subtotal) VALUES
-- Order 1  (Rohan Mehta | Credit Card | Nov 2025)
(1,  1, 21,  1, 11.99, 11.99),   -- The Alchemist
(2,  1,  1,  1, 12.99, 12.99),   -- Nineteen Eighty-Four
(3,  1,  7,  1, 16.99, 16.99),   -- One Hundred Years of Solitude

-- Order 2  (Karan Singh | UPI | Dec 2025)
(4,  2, 12,  1, 10.99, 10.99),   -- Murder on the Orient Express
(5,  2, 13,  2,  9.99, 19.98),   -- And Then There Were None x2
(6,  2,  2,  1,  9.99,  9.99),   -- Animal Farm

-- Order 3  (Aarav Sharma | Debit Card | Dec 2025)
(7,  3, 15,  2, 10.99, 21.98),   -- HP Philosopher's Stone x2
(8,  3,  9,  1, 13.99, 13.99),   -- Norwegian Wood
(9,  3,  4,  1, 15.99, 15.99),   -- Beloved

-- Order 4  (Vikram Patel | Cash | Jan 2026)
(10, 4,  2,  1,  9.99,  9.99),   -- Animal Farm
(11, 4, 21,  1, 11.99, 11.99),   -- The Alchemist

-- Order 5  (Arjun Desai | Credit Card | Jan 2026)
(12, 5, 18,  1, 14.99, 14.99),   -- The Shining
(13, 5, 10,  1, 17.99, 17.99),   -- Kafka on the Shore
(14, 5,  7,  1, 16.99, 16.99),   -- One Hundred Years of Solitude

-- Order 6  (Priya Nair | UPI | Jan 2026)
(15, 6,  4,  1, 15.99, 15.99),   -- Beloved

-- Order 7  (Sneha Iyer | Cash | Feb 2026)
(16, 7, 13,  1,  9.99,  9.99),   -- And Then There Were None
(17, 7,  1,  1, 12.99, 12.99),   -- Nineteen Eighty-Four
(18, 7,  5,  1, 14.99, 14.99),   -- Song of Solomon

-- Order 8  (Rahul Gupta | Credit Card | Feb 2026)
(19, 8, 16,  1, 11.99, 11.99),   -- HP Chamber of Secrets
(20, 8, 15,  1, 10.99, 10.99),   -- HP Philosopher's Stone

-- Order 9  (Anjali Reddy | Debit Card | Feb 2026)
(21, 9, 25,  1, 17.99, 17.99),   -- American Gods
(22, 9,  8,  1, 15.99, 15.99),   -- Love in the Time of Cholera
(23, 9, 11,  1, 18.99, 18.99),   -- The Wind-Up Bird Chronicle

-- Order 10  (Meera Krishnan | UPI | Mar 2026)
(24,10, 12,  2, 10.99, 21.98),   -- Murder on the Orient Express x2
(25,10, 14,  1, 11.99, 11.99),   -- The ABC Murders
(26,10,  2,  1,  9.99,  9.99),   -- Animal Farm

-- Order 11  (Aarav Sharma | Credit Card | Mar 2026)
(27,11, 17,  1, 12.99, 12.99),   -- HP Prisoner of Azkaban
(28,11, 18,  1, 14.99, 14.99),   -- The Shining
(29,11,  7,  2, 16.99, 33.98),   -- One Hundred Years of Solitude x2

-- Order 12  (Siddharth Rao | Cash | Apr 2026)
(30,12, 19,  1, 19.99, 19.99),   -- It

-- Order 13  (Rohan Mehta | UPI | Apr 2026)
(31,13,  5,  1, 14.99, 14.99),   -- Song of Solomon
(32,13,  9,  1, 13.99, 13.99),   -- Norwegian Wood
(33,13,  2,  1,  9.99,  9.99),   -- Animal Farm

-- Order 14  (Divya Pillai | Credit Card | Apr 2026)
(34,14, 21,  2, 11.99, 23.98),   -- The Alchemist x2
(35,14, 23,  1, 16.99, 16.99),   -- Half of a Yellow Sun
(36,14,  8,  1, 15.99, 15.99),   -- Love in the Time of Cholera

-- Order 15  (Nisha Joshi | Cash | May 2026)
(37,15, 15,  1, 10.99, 10.99),   -- HP Philosopher's Stone
(38,15, 16,  1, 11.99, 11.99),   -- HP Chamber of Secrets

-- Order 16  (Karan Singh | Debit Card | May 2026)
(39,16, 10,  1, 17.99, 17.99),   -- Kafka on the Shore
(40,16, 25,  1, 17.99, 17.99),   -- American Gods
(41,16,  4,  1, 15.99, 15.99),   -- Beloved

-- Order 17  (Priya Nair | UPI | Jun 2026)
(42,17, 23,  1, 16.99, 16.99),   -- Half of a Yellow Sun

-- Order 18  (Kavya Menon | Credit Card | Jul 2026)
(43,18,  1,  1, 12.99, 12.99),   -- Nineteen Eighty-Four
(44,18, 21,  1, 11.99, 11.99),   -- The Alchemist
(45,18,  9,  1, 13.99, 13.99),   -- Norwegian Wood

-- Order 19  (Vikram Patel | Cash | Aug 2026 — CANCELLED)
(46,19, 24,  1, 12.99, 12.99),   -- Purple Hibiscus

-- Order 20  (Arjun Desai | UPI | Sep 2026)
(47,20, 15,  1, 10.99, 10.99),   -- HP Philosopher's Stone
(48,20, 17,  1, 12.99, 12.99),   -- HP Prisoner of Azkaban
(49,20, 13,  1,  9.99,  9.99),   -- And Then There Were None

-- Order 21  (Aditya Verma | Credit Card | Oct 2026)
(50,21, 25,  1, 17.99, 17.99),   -- American Gods
(51,21,  7,  1, 16.99, 16.99),   -- One Hundred Years of Solitude
(52,21,  5,  1, 14.99, 14.99),   -- Song of Solomon

-- Order 22  (Anjali Reddy | Cash | Nov 2026 — CANCELLED)
(53,22, 11,  1, 18.99, 18.99);   -- The Wind-Up Bird Chronicle
