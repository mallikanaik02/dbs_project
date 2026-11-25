# generate_doc.py
# Generates the complete, styled Word document (.docx) for the Shelf & Co. Database Systems Mini Project Report.
# Fully updated for the M:N Many-to-Many Co-Authorship schema (Book_Authors junction table).

import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc = Document()

# Set standard margins (1 inch all around)
for s in doc.sections:
    s.top_margin = Inches(1)
    s.bottom_margin = Inches(1)
    s.left_margin = Inches(1)
    s.right_margin = Inches(1)

# Curated Color Palette
COLOR_PRIMARY = RGBColor(24, 58, 50)      # Deep Forest Green (#183A32)
COLOR_SECONDARY = RGBColor(92, 140, 110)  # Muted Sage (#5C8C6E)
COLOR_TEXT = RGBColor(30, 30, 30)         # Charcoal text
COLOR_MUTED = RGBColor(100, 100, 100)     # Muted grey
COLOR_ALERT = RGBColor(196, 96, 58)       # Warm Terracotta (#C4603A)

# Set base Calibri font (per teacher guidelines: Calibri Body 12pt)
style_normal = doc.styles['Normal']
style_normal.font.name = 'Calibri'
style_normal.font.size = Pt(12)
style_normal.font.color.rgb = COLOR_TEXT
style_normal.paragraph_format.line_spacing = 1.15
style_normal.paragraph_format.space_after = Pt(6)

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_header_p(text, level=1):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.bold = True
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = COLOR_PRIMARY
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
    elif level == 2:
        run.font.size = Pt(14)
        run.font.color.rgb = COLOR_SECONDARY
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
    elif level == 3:
        run.font.size = Pt(12.5)
        run.font.color.rgb = COLOR_PRIMARY
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
    return p

def add_code_block(code_text):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, "F4F3EF")
    set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="18" w:space="0" w:color="5C8C6E"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.line_spacing = 1.0
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(code_text)
    run.font.name = 'Consolas'
    run.font.size = Pt(9.5)
    run.font.color.rgb = RGBColor(30, 45, 40)
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(4)

def add_image_placeholder(fig_num, heading, instructions):
    tbl = doc.add_table(rows=1, cols=1)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False
    cell = tbl.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, "FAF9F5")
    set_cell_margins(cell, top=160, bottom=160, left=200, right=200)
    
    tcPr = cell._tc.get_or_add_tcPr()
    borders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:top w:val="dashed" w:sz="12" w:space="0" w:color="C4603A"/><w:left w:val="dashed" w:sz="12" w:space="0" w:color="C4603A"/><w:right w:val="dashed" w:sz="12" w:space="0" w:color="C4603A"/><w:bottom w:val="dashed" w:sz="12" w:space="0" w:color="C4603A"/></w:tcBorders>')
    tcPr.append(borders)
    
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_after = Pt(4)
    run_badge = p.add_run("[ INSERT SCREENSHOT HERE ]\n")
    run_badge.bold = True
    run_badge.font.size = Pt(11)
    run_badge.font.color.rgb = COLOR_ALERT
    
    run_title = p.add_run(f"Figure {fig_num}: {heading}\n")
    run_title.bold = True
    run_title.font.size = Pt(11)
    run_title.font.color.rgb = COLOR_PRIMARY
    
    run_desc = p.add_run(f"Required Content: {instructions}")
    run_desc.italic = True
    run_desc.font.size = Pt(9.5)
    run_desc.font.color.rgb = COLOR_MUTED
    
    p_spacer = doc.add_paragraph()
    p_spacer.paragraph_format.space_after = Pt(6)

def style_table(table, col_widths, headers, data):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].width = col_widths[i]
        set_cell_background(hdr_cells[i], "183A32")
        set_cell_margins(hdr_cells[i], top=100, bottom=100, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_after = Pt(0)
        run = p.add_run(title)
        run.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(10)
        
    for r_idx, row_data in enumerate(data):
        row = table.rows[r_idx + 1]
        bg_col = "FFFFFF" if r_idx % 2 == 0 else "F8F7F3"
        for c_idx, val in enumerate(row_data):
            cell = row.cells[c_idx]
            cell.width = col_widths[c_idx]
            set_cell_background(cell, bg_col)
            set_cell_margins(cell, top=80, bottom=80, left=140, right=140)
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            run = p.add_run(str(val))
            run.font.size = Pt(9.5)

# ==================== COVER / TITLE ====================
p_title = doc.add_paragraph()
p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_title.paragraph_format.space_before = Pt(36)
p_title.paragraph_format.space_after = Pt(4)
r_t1 = p_title.add_run("SHELF & CO.\nBOOKSTORE MANAGEMENT SYSTEM\n")
r_t1.bold = True
r_t1.font.size = Pt(24)
r_t1.font.color.rgb = COLOR_PRIMARY

r_sub = p_title.add_run("Database Systems Mini Project — Laboratory Documentation Report")
r_sub.font.size = Pt(14)
r_sub.font.color.rgb = COLOR_SECONDARY

p_rule = doc.add_paragraph()
p_rule.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_rule.paragraph_format.space_after = Pt(20)
r_rule = p_rule.add_run("―" * 45)
r_rule.font.color.rgb = COLOR_MUTED

# Metadata box
tbl_meta = doc.add_table(rows=5, cols=2)
tbl_meta.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_info = [
    ("Course Name:", "Database Systems & Management (DBMS Laboratory)"),
    ("Application Name:", "Shelf & Co. — Boutique Independent Bookstore Management"),
    ("Database Engine:", "MySQL 8.0 / MariaDB 10.4 (InnoDB Engine, UTF-8 Unicode)"),
    ("Schema Design:", "7 Relational Tables, M:N Co-Authorship Association (3NF Normalized)"),
    ("Development Stack:", "HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, Chart.js")
]
for i, (k, v) in enumerate(meta_info):
    c1, c2 = tbl_meta.rows[i].cells
    c1.width = Inches(2.2)
    c2.width = Inches(4.3)
    set_cell_margins(c1, top=60, bottom=60, left=80, right=80)
    set_cell_margins(c2, top=60, bottom=60, left=80, right=80)
    p1 = c1.paragraphs[0]
    p1.paragraph_format.space_after = Pt(0)
    r1 = p1.add_run(k)
    r1.bold = True
    r1.font.size = Pt(10.5)
    r1.font.color.rgb = COLOR_PRIMARY
    
    p2 = c2.paragraphs[0]
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run(v)
    r2.font.size = Pt(10.5)

doc.add_page_break()

# ==================== SECTION 1 ====================
add_header_p("1. INTRODUCTION & PROBLEM STATEMENT", level=1)

add_header_p("1.1 System Overview", level=2)
doc.add_paragraph(
    "Shelf & Co. is a specialized, database-driven Bookstore Management System architected for independent and boutique "
    "bookstores. Unlike high-volume mass-retailers, independent bookstores require deep categorization across specialized genres, "
    "curated author biographies, support for multiple co-authors per publication, precise stock level tracking for rare editions, "
    "and seamless management of walk-in and registered customer accounts. The software combines an editorial, structured "
    "administrative interface with an enterprise-grade relational database management system (MySQL 8.0/MariaDB) to guarantee "
    "reliable inventory counts, transaction safety, referential integrity, and granular sales analytics."
)

add_header_p("1.2 Problem Statement", level=2)
doc.add_paragraph(
    "Traditional retail bookstores frequently struggle with severe operational challenges, including:\n"
    "1. Disjointed Inventory Control: Discrepancies between physical stock and digital records result in unexpected out-of-stock scenarios or unnecessary over-ordering.\n"
    "2. Inadequate Co-Authorship Support: Naïve 1:N database designs assign only a single author foreign key to each book, failing to model real-world academic anthologies, collaborative works, or translations with multiple contributors without violating First Normal Form (1NF).\n"
    "3. Loss of Historical Sales Integrity: In unconstrained databases, deleting an author or customer record often cascades silently, permanently corrupting financial ledgers and sales analytics.\n"
    "4. Concurrency & Overselling Risks: High-frequency customer checkouts without ACID-compliant database transactions risk overselling limited single-copy editions.\n"
    "5. Lack of Actionable Business Insights: Store managers lack visibility into category revenue distributions, customer lifetime spending tiers, dead-stock items (unsold titles), and restocking thresholds."
)

add_header_p("1.3 Objectives", level=2)
doc.add_paragraph(
    "The primary objectives of the Shelf & Co. database application are:\n"
    "• Relational Database Integrity: Design and implement a normalized (3NF) relational database consisting of 7 tables, enforcing domain constraints, check constraints, unique constraints, foreign key referential integrity (RESTRICT, CASCADE, SET NULL), and Many-to-Many (M:N) co-authorship via an associative bridge table (Book_Authors).\n"
    "• Atomic POS Checkout: Implement transaction-safe order checkouts (START TRANSACTION, COMMIT, ROLLBACK) that validate inventory with row locking before committing financial records and inventory decrements.\n"
    "• Complete CRUD Operations: Deliver an intuitive desktop-first user interface to Create, Read, Update, and safely Delete records across Books, Authors, Categories, Customers, and Orders.\n"
    "• Advanced SQL Demonstration: Implement complex SQL queries—including multi-table INNER and LEFT JOINs, scalar and set-membership subqueries (NOT IN), aggregate functions (SUM, AVG, COUNT, MIN, MAX), and GROUP BY with HAVING filters.\n"
    "• Refined Editorial UI: Deliver an aesthetic, accessible user interface inspired by premium publications, utilizing warm ivory (#F7F5F0), deep forest green (#183A32), muted sage, and warm terracotta."
)

# ==================== SECTION 2 ====================
add_header_p("2. REQUIREMENT ANALYSIS & SYSTEM ARCHITECTURE", level=1)

add_header_p("2.1 Functional Requirements", level=2)
headers_req = ["Module", "Core Functional Capabilities"]
data_req = [
    ["Overview Dashboard", "Real-time KPI cards (titles, inventory, customers, revenue, low stock), live Chart.js charts (monthly revenue, category share, bestselling books), and low-stock alert tables."],
    ["Book Inventory", "Live search (title, ISBN, author), multi-filter queries (category, author, price range, stock availability), column sorting, pagination, multi-author aggregation via GROUP_CONCAT, and modal dialog forms for book creation and updating."],
    ["Authors Module", "Author biographical management, live book counts per author (aggregated via Book_Authors junction table), drill-down modal showing all publications by an author, deletion protection when books exist."],
    ["Categories Module", "Genre classification with book counts, drill-down viewing of books in a category with author lists, foreign key deletion protection."],
    ["Customer CRM", "Customer registration and contact details, customer purchase analytics (total orders, total amount spent, average order value), full order history ledger."],
    ["POS Sales & Orders", "Interactive sales cart supporting registered customers and walk-in sales, real-time stock checks, payment method tracking, and transaction-safe order cancellation with automated inventory replenishment."],
    ["Reports Engine", "10 database-backed reports covering sales summaries, monthly revenue, bestselling items (HAVING), category sales, high-value customers, inventory valuation, configurable low-stock thresholds, and subquery analyses with one-click CSV export."]
]
tbl_req = doc.add_table(rows=len(data_req) + 1, cols=2)
style_table(tbl_req, [Inches(1.8), Inches(4.7)], headers_req, data_req)

add_header_p("2.2 System Stack Specification", level=2)
headers_stack = ["Layer", "Component", "Technology / Specification"]
data_stack = [
    ["Frontend", "Markup & Presentation", "Semantic HTML5, Custom Responsive CSS3 (Flexbox & CSS Grid)"],
    ["Frontend", "Client Scripting", "Vanilla JavaScript (ES6+ async/await, Fetch API, DOM manipulation)"],
    ["Frontend", "Visual Analytics", "Chart.js 4.4.3"],
    ["Frontend", "Typography & Icons", "DM Sans & Manrope (Google Fonts), Lucide Icons"],
    ["Backend", "Runtime Environment", "Node.js (v18.0+ / v22.17.1 LTS)"],
    ["Backend", "Web Application Framework", "Express.js 4.19.2 (RESTful Architecture)"],
    ["Database", "Database Engine", "MySQL 8.0 / MariaDB 10.4 (InnoDB Engine, UTF-8 Unicode)"],
    ["Connectivity", "Database Driver", "mysql2/promise (Parameterized Prepared Statements, Connection Pooling)"]
]
tbl_stack = doc.add_table(rows=len(data_stack) + 1, cols=3)
style_table(tbl_stack, [Inches(1.5), Inches(2.2), Inches(2.8)], headers_stack, data_stack)

add_header_p("2.3 System Architecture Diagram", level=2)
doc.add_paragraph(
    "The application follows a clean 3-Tier Architecture consisting of a presentation tier (Single Page Application in Vanilla JS), "
    "an application server tier (Node.js and Express REST API), and a data persistence tier (MySQL 8 / MariaDB with InnoDB engine). "
    "Client requests are routed asynchronously via JSON REST endpoints, where inputs are sanitized before executing parameterized queries."
)

add_image_placeholder(
    "2.1",
    "System Architecture and Data Flow Diagram",
    "Insert an architectural block diagram showing the 3 tiers: Browser Client (HTML/CSS/JS) <--> Express Backend API (/api/*) <--> MySQL Relational Database (InnoDB)."
)

# ==================== SECTION 3 ====================
add_header_p("3. DATABASE DESIGN & NORMALIZATION PROOF", level=1)

add_header_p("3.1 Entity-Relationship (ER) Diagram", level=2)
doc.add_paragraph(
    "The database structure consists of seven core relational entities: Authors, Categories, Books, Book_Authors (associative bridge entity), "
    "Customers, Orders, and Order_Items. The cardinalities modeled include:\n"
    "• Authors and Books (M:N): An Author can write many Books, and a Book can be co-authored by many Authors. This Many-to-Many relationship is decomposed into two 1:N binary relationships via the Book_Authors associative table.\n"
    "• Book_Authors to Authors (N:1): Each association row references exactly one Author (ON DELETE RESTRICT, ON UPDATE CASCADE).\n"
    "• Book_Authors to Books (N:1): Each association row references exactly one Book (ON DELETE CASCADE, ON UPDATE CASCADE).\n"
    "• Categories to Books (1:N): One Category classifies zero or more Books (ON DELETE RESTRICT, ON UPDATE CASCADE).\n"
    "• Customers to Orders (1:N): One Customer places zero or more Orders (ON DELETE SET NULL to preserve financial records for walk-in transactions).\n"
    "• Orders to Order_Items (1:N): One Order contains one or more Order_Items (ON DELETE CASCADE, ON UPDATE CASCADE).\n"
    "• Books to Order_Items (1:N): One Book is referenced in zero or more Order_Items (ON DELETE RESTRICT to preserve sales audit history)."
)

add_image_placeholder(
    "3.1",
    "Complete Entity-Relationship (ER) Diagram",
    "Insert an exported diagram from MySQL Workbench (EER Diagram) or data modeling tool showing all 7 tables (including the Book_Authors junction table), primary keys (PK), composite primary key (book_id, author_id), foreign keys (FK), attributes, and relationship lines with crow's foot cardinalities."
)

add_header_p("3.2 Relational Schema Specifications", level=2)
doc.add_paragraph(
    "1. Authors(author_id [PK], author_name [NOT NULL], biography, created_at [DEFAULT CURRENT_TIMESTAMP])\n"
    "2. Categories(category_id [PK], category_name [NOT NULL, UNIQUE], description)\n"
    "3. Books(book_id [PK], isbn [NOT NULL, UNIQUE], title [NOT NULL], category_id [FK to Categories, RESTRICT], price [NOT NULL, CHECK > 0], stock_quantity [NOT NULL, DEFAULT 0, CHECK >= 0], publication_year, publisher, created_at)\n"
    "4. Book_Authors(book_id [PK, FK to Books, CASCADE], author_id [PK, FK to Authors, RESTRICT], author_role [DEFAULT 'Author']) -- Composite Primary Key: (book_id, author_id)\n"
    "5. Customers(customer_id [PK], customer_name [NOT NULL], email [NOT NULL, UNIQUE], phone [NOT NULL, UNIQUE], address, registration_date [DEFAULT CURRENT_DATE])\n"
    "6. Orders(order_id [PK], customer_id [FK to Customers, SET NULL], order_date [DEFAULT CURRENT_TIMESTAMP], total_amount [NOT NULL, CHECK >= 0], payment_method [DEFAULT 'Cash'], status [DEFAULT 'Completed'])\n"
    "7. Order_Items(order_item_id [PK], order_id [FK to Orders, CASCADE], book_id [FK to Books, RESTRICT], quantity [NOT NULL, CHECK > 0], unit_price [NOT NULL, CHECK > 0], subtotal [NOT NULL, CHECK > 0])"
)

add_header_p("3.3 Normalization Proof (1NF to 3NF)", level=2)
headers_norm = ["Normal Form", "Formal Rule Requirement", "How Shelf & Co. Relational Design Satisfies Rule"]
data_norm = [
    ["1NF (First Normal Form)", 
     "All column values must be atomic (indivisible). No multi-valued attributes or repeating groups. Every table must possess a designated primary key.", 
     "Each field stores exactly one atomic value. Crucially, multi-author co-authorship is resolved via the dedicated `Book_Authors` associative table rather than storing comma-separated author lists or repeating columns (author_1, author_2) in `Books`. Order line items are similarly factored into `Order_Items`."],
    
    ["2NF (Second Normal Form)", 
     "Must be in 1NF, and all non-key attributes must be fully functionally dependent on the entire primary key (no partial key dependencies).", 
     "The six entity tables (`Books`, `Authors`, `Categories`, `Customers`, `Orders`, `Order_Items`) utilize single-attribute surrogate primary keys, making partial dependency mathematically impossible. In `Book_Authors`, which uses a composite primary key `(book_id, author_id)`, the non-key attribute `author_role` depends strictly on the combined pair (an author's contribution role is specific to that particular book), perfectly satisfying 2NF."],
    
    ["3NF (Third Normal Form)", 
     "Must be in 2NF, and no non-key attribute is transitively dependent on another non-key attribute (elimination of transitive dependency X -> Y -> Z).", 
     "Author biographical data resides exclusively in `Authors` rather than duplicating inside `Books`. Category descriptions reside in `Categories`. Customer profiles are linked by `customer_id` rather than embedded in `Orders`. Every non-key attribute depends solely on the primary key, satisfying 3NF."]
]
tbl_norm = doc.add_table(rows=len(data_norm) + 1, cols=3)
style_table(tbl_norm, [Inches(1.5), Inches(2.3), Inches(2.7)], headers_norm, data_norm)

# ==================== SECTION 4 ====================
add_header_p("4. IMPLEMENTATION DETAILS & SQL CONCEPTS", level=1)

add_header_p("4.1 Core DDL SQL Script", level=2)
ddl_code = """-- Complete MySQL 8 Schema Creation with M:N Book_Authors Junction
DROP DATABASE IF EXISTS shelf_and_co;
CREATE DATABASE shelf_and_co CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shelf_and_co;

CREATE TABLE Authors (
  author_id   INT PRIMARY KEY AUTO_INCREMENT,
  author_name VARCHAR(150) NOT NULL,
  biography   TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Categories (
  category_id   INT PRIMARY KEY AUTO_INCREMENT,
  category_name VARCHAR(100) NOT NULL UNIQUE,
  description   VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE Books (
  book_id          INT PRIMARY KEY AUTO_INCREMENT,
  isbn             VARCHAR(20) UNIQUE NOT NULL,
  title            VARCHAR(200) NOT NULL,
  category_id      INT NOT NULL,
  price            DECIMAL(10,2) NOT NULL CHECK (price > 0),
  stock_quantity   INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  publication_year INT,
  publisher        VARCHAR(150),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES Categories(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Associative junction table resolving M:N Co-Authorship
CREATE TABLE Book_Authors (
  book_id     INT NOT NULL,
  author_id   INT NOT NULL,
  author_role VARCHAR(50) DEFAULT 'Author',
  PRIMARY KEY (book_id, author_id),
  FOREIGN KEY (book_id)   REFERENCES Books(book_id)     ON DELETE CASCADE  ON UPDATE CASCADE,
  FOREIGN KEY (author_id) REFERENCES Authors(author_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Customers (
  customer_id       INT PRIMARY KEY AUTO_INCREMENT,
  customer_name     VARCHAR(150) NOT NULL,
  email             VARCHAR(150) UNIQUE NOT NULL,
  phone             VARCHAR(15) UNIQUE NOT NULL,
  address           VARCHAR(255),
  registration_date DATE DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB;

CREATE TABLE Orders (
  order_id       INT PRIMARY KEY AUTO_INCREMENT,
  customer_id    INT,
  order_date     DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_amount   DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method VARCHAR(30) DEFAULT 'Cash',
  status         VARCHAR(30) DEFAULT 'Completed',
  FOREIGN KEY (customer_id) REFERENCES Customers(customer_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Order_Items (
  order_item_id INT PRIMARY KEY AUTO_INCREMENT,
  order_id      INT NOT NULL,
  book_id       INT NOT NULL,
  quantity      INT NOT NULL CHECK (quantity > 0),
  unit_price    DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  subtotal      DECIMAL(10,2) NOT NULL CHECK (subtotal > 0),
  FOREIGN KEY (order_id) REFERENCES Orders(order_id) ON DELETE CASCADE  ON UPDATE CASCADE,
  FOREIGN KEY (book_id)  REFERENCES Books(book_id)   ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Optimized Indexes
CREATE INDEX idx_books_category      ON Books(category_id);
CREATE INDEX idx_books_title         ON Books(title);
CREATE INDEX idx_book_authors_author ON Book_Authors(author_id);
CREATE INDEX idx_book_authors_book   ON Book_Authors(book_id);
CREATE INDEX idx_orders_customer     ON Orders(customer_id);
CREATE INDEX idx_orders_date         ON Orders(order_date);
CREATE INDEX idx_order_items_order   ON Order_Items(order_id);
CREATE INDEX idx_order_items_book    ON Order_Items(book_id);"""
add_code_block(ddl_code)

add_header_p("4.2 Sample Data Population Summary", level=2)
doc.add_paragraph(
    "The application database is seeded via `database/seed.sql` with a total of 159 records across all 7 tables (well above the 50-record guideline minimum):\n"
    "• Authors: 10 distinguished literary figures (George Orwell, Toni Morrison, Gabriel García Márquez, Haruki Murakami, Agatha Christie, etc.).\n"
    "• Categories: 8 realistic genres (Fiction, Mystery, Fantasy, Romance, Science Fiction, Non-fiction, Psychology, History).\n"
    "• Books: 25 titles with diverse stock quantities (including healthy stock, low stock <= 5, and out-of-stock items) and pricing ($9.99 to $19.99).\n"
    "• Book_Authors: 26 relationship mappings linking books to authors, including co-authorship demonstration (e.g. Gabriel García Márquez and Neil Gaiman co-credited on Book ID 7).\n"
    "• Customers: 15 customer accounts with realistic contact details and residential addresses across Indian metropolitan regions.\n"
    "• Orders: 22 orders across diverse payment methods (Cash, Credit Card, Debit Card, UPI) and order statuses.\n"
    "• Order_Items: 53 line items connecting books with quantities and unit prices."
)

add_image_placeholder(
    "4.1",
    "Database Tables and Record Count Verification in MySQL",
    "Screenshot of terminal, phpMyAdmin, or MySQL CLI running: SELECT 'Authors' AS tbl, count(*) AS cnt FROM Authors UNION ALL SELECT 'Categories', count(*) FROM Categories UNION ALL SELECT 'Books', count(*) FROM Books UNION ALL SELECT 'Book_Authors', count(*) FROM Book_Authors UNION ALL SELECT 'Customers', count(*) FROM Customers UNION ALL SELECT 'Orders', count(*) FROM Orders UNION ALL SELECT 'Order_Items', count(*) FROM Order_Items;"
)

add_header_p("4.3 Ten Key SQL Queries Used in the Application", level=2)

queries_list = [
    ("Query 1: Multi-Table INNER JOIN with GROUP_CONCAT (Books with Co-Authors & Category)",
     "Populates the Book Inventory catalog table with aggregated co-author names and category.",
     """SELECT b.book_id, b.isbn, b.title,
       GROUP_CONCAT(a.author_name ORDER BY ba.author_role SEPARATOR ', ') AS authors,
       c.category_name, b.price, b.stock_quantity, b.publication_year
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id = ba.book_id
INNER JOIN Authors a       ON ba.author_id = a.author_id
INNER JOIN Categories c    ON b.category_id = c.category_id
GROUP BY b.book_id, b.isbn, b.title, c.category_name, b.price, b.stock_quantity, b.publication_year
ORDER BY b.title ASC;"""),
    
    ("Query 2: Multi-Table LEFT JOIN (Customer Spending & Order Aggregation)",
     "Computes lifetime customer value, retaining customers who have never placed an order.",
     """SELECT cu.customer_id, cu.customer_name, cu.email, cu.phone,
       COUNT(o.order_id) AS total_orders,
       COALESCE(SUM(o.total_amount), 0) AS total_spent,
       COALESCE(AVG(o.total_amount), 0) AS avg_order_value
FROM Customers cu
LEFT JOIN Orders o ON cu.customer_id = o.customer_id AND o.status = 'Completed'
GROUP BY cu.customer_id, cu.customer_name, cu.email, cu.phone;"""),
    
    ("Query 3: Multi-Table Sales Join (Order Details with Line Items)",
     "Displays comprehensive order cards including items purchased and customer details.",
     """SELECT o.order_id, COALESCE(cu.customer_name, 'Walk-in Customer') AS customer_name,
       o.order_date, o.total_amount, o.payment_method, o.status,
       COUNT(oi.order_item_id) AS item_count
FROM Orders o
LEFT JOIN Customers cu   ON o.customer_id = cu.customer_id
LEFT JOIN Order_Items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, cu.customer_name, o.order_date, o.total_amount, o.payment_method, o.status;"""),

    ("Query 4: Scalar Subquery in WHERE Clause (Books Above Average Price)",
     "Identifies premium editions priced strictly above the catalog average price.",
     """SELECT b.book_id, b.title,
       GROUP_CONCAT(a.author_name ORDER BY ba.author_role SEPARATOR ', ') AS authors,
       c.category_name, b.price,
       ROUND((SELECT AVG(price) FROM Books), 2) AS avg_catalog_price
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id = ba.book_id
INNER JOIN Authors a       ON ba.author_id = a.author_id
INNER JOIN Categories c    ON b.category_id = c.category_id
WHERE b.price > (SELECT AVG(price) FROM Books)
GROUP BY b.book_id, b.title, c.category_name, b.price
ORDER BY b.price DESC;"""),

    ("Query 5: Set-Membership Subquery with NOT IN (Dead Stock / Unsold Books)",
     "Discovers catalog titles that have never recorded a single customer sale.",
     """SELECT b.book_id, b.isbn, b.title,
       GROUP_CONCAT(a.author_name ORDER BY ba.author_role SEPARATOR ', ') AS authors,
       c.category_name, b.price, b.stock_quantity
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id = ba.book_id
INNER JOIN Authors a       ON ba.author_id = a.author_id
INNER JOIN Categories c    ON b.category_id = c.category_id
WHERE b.book_id NOT IN (
    SELECT DISTINCT book_id FROM Order_Items
)
GROUP BY b.book_id, b.isbn, b.title, c.category_name, b.price, b.stock_quantity;"""),

    ("Query 6: GROUP BY with Date Formatting (Monthly Revenue Trend)",
     "Generates chronological revenue and volume metrics for dashboard charts.",
     """SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
       DATE_FORMAT(order_date, '%b %Y') AS month_label,
       COUNT(order_id) AS order_count,
       SUM(total_amount) AS monthly_revenue
FROM Orders
WHERE status = 'Completed'
GROUP BY DATE_FORMAT(order_date, '%Y-%m'), DATE_FORMAT(order_date, '%b %Y')
ORDER BY month ASC;"""),

    ("Query 7: GROUP BY and HAVING Clause (Top Bestselling Books by Volume)",
     "Filters bestselling books having cumulative sales quantities above a user threshold.",
     """SELECT b.book_id, b.title,
       GROUP_CONCAT(a.author_name ORDER BY ba.author_role SEPARATOR ', ') AS authors,
       c.category_name,
       SUM(oi.quantity) AS total_sold,
       SUM(oi.subtotal) AS total_revenue
FROM Books b
INNER JOIN Book_Authors ba ON b.book_id = ba.book_id
INNER JOIN Authors a       ON ba.author_id = a.author_id
INNER JOIN Categories c    ON b.category_id = c.category_id
INNER JOIN Order_Items oi  ON b.book_id = oi.book_id
INNER JOIN Orders o        ON oi.order_id = o.order_id
WHERE o.status = 'Completed'
GROUP BY b.book_id, b.title, c.category_name
HAVING SUM(oi.quantity) >= 2
ORDER BY total_sold DESC;"""),

    ("Query 8: M:N Bridge Identification Query (Co-Authored Books with Multiple Authors)",
     "Leverages HAVING on the associative junction table to identify all collaborative publications.",
     """SELECT b.book_id, b.title,
       COUNT(ba.author_id) AS co_author_count,
       GROUP_CONCAT(a.author_name ORDER BY ba.author_role SEPARATOR ', ') AS authors
FROM Books b
JOIN Book_Authors ba ON b.book_id = ba.book_id
JOIN Authors a       ON ba.author_id = a.author_id
GROUP BY b.book_id, b.title
HAVING COUNT(ba.author_id) > 1;"""),

    ("Query 9: Conditional Aggregates (Overview Dashboard Live Statistics)",
     "Single-pass computation of inventory volume, price bounds, and stock counts.",
     """SELECT COUNT(book_id) AS total_titles,
       COALESCE(SUM(stock_quantity), 0) AS total_inventory,
       COALESCE(SUM(CASE WHEN stock_quantity <= 5 AND stock_quantity > 0 THEN 1 ELSE 0 END), 0) AS low_stock_count,
       COALESCE(SUM(CASE WHEN stock_quantity = 0 THEN 1 ELSE 0 END), 0) AS out_of_stock_count
FROM Books;"""),

    ("Query 10: Atomic Inventory Checkout Transaction",
     "ACID transaction for sales creation with row-level stock locking and immediate deduction.",
     """START TRANSACTION;
SELECT stock_quantity, price FROM Books WHERE book_id = 1 FOR UPDATE;
INSERT INTO Orders (customer_id, total_amount, payment_method, status) VALUES (3, 25.98, 'Credit Card', 'Completed');
INSERT INTO Order_Items (order_id, book_id, quantity, unit_price, subtotal) VALUES (LAST_INSERT_ID(), 1, 2, 12.99, 25.98);
UPDATE Books SET stock_quantity = stock_quantity - 2 WHERE book_id = 1;
COMMIT;""")
]

for title, desc, q_code in queries_list:
    add_header_p(title, level=3)
    p_desc = doc.add_paragraph()
    r_d = p_desc.add_run(f"Purpose: {desc}")
    r_d.italic = True
    r_d.font.size = Pt(10.5)
    add_code_block(q_code)

# ==================== SECTION 5 ====================
add_header_p("5. FRONTEND & UI INTEGRATION (SCREENSHOTS GUIDE)", level=1)
doc.add_paragraph(
    "This section outlines the graphical user interfaces developed for Shelf & Co., showcasing the editorial aesthetic, "
    "CRUD form operations, real-time input validations, and analytical report visualizations. "
    "Replace each placeholder box below with your actual system screenshot."
)

add_image_placeholder(
    "5.1",
    "Shelf & Co. Overview Dashboard Interface",
    "Open http://localhost:3000/#overview. Capture the full browser showing the top KPI cards, the 4 Chart.js charts, recent orders, and low-stock table."
)

add_image_placeholder(
    "5.2",
    "Mandatory Form 1: Book Creation & Modification Modal Form",
    "In 'Book Inventory', click '+ Add Book'. Capture the modal displaying ISBN, Title, Author dropdown, Category dropdown, Price, Stock Quantity, Year, and Publisher."
)

add_image_placeholder(
    "5.3",
    "Mandatory Form 2: Author Profile Management Modal Form",
    "In 'Authors', click '+ Add Author'. Capture the modal dialog showing Author Name and Biography text area."
)

add_image_placeholder(
    "5.4",
    "Mandatory Form 3: Category Creation Modal Form",
    "In 'Categories', click '+ Add Category'. Capture the modal dialog displaying Category Name and Description."
)

add_image_placeholder(
    "5.5",
    "Mandatory Form 4: Customer Registration Modal Form",
    "In 'Customers', click '+ Add Customer'. Capture the modal showing inputs for Full Name, Email, Phone Number, and Address."
)

add_image_placeholder(
    "5.6",
    "Mandatory Form 5: Interactive POS Sales Checkout with Active Cart",
    "In 'Sales & Orders', click '+ New Sale'. Search for 2 books, add them to cart, adjust quantities, select Customer & Payment method, and capture the live subtotal."
)

add_image_placeholder(
    "5.7",
    "Book Inventory Management with Live Search & Multi-Filters",
    "In 'Book Inventory', enter a search keyword (e.g., 'Orwell'), select a category filter, and capture the filtered table showing co-authors and pagination controls."
)

add_image_placeholder(
    "5.8",
    "Customer Purchase History & Lifetime Analytics Modal",
    "In 'Customers', click the eye icon next to any customer. Capture the modal showing lifetime spend, order count, and detailed historical order list."
)

add_image_placeholder(
    "5.9",
    "Frontend & Backend Validation Alerts (Duplicate Key / Required Fields)",
    "Attempt to insert a book with a duplicate ISBN or blank title. Capture the red inline validation error or toast notification."
)

add_image_placeholder(
    "5.10",
    "Safe Referential Integrity Deletion Protection Alert",
    "In 'Authors', attempt to delete an author who has books in inventory (e.g. George Orwell). Capture the alert: 'Cannot delete: author has books in inventory.'"
)

# ==================== SECTION 6 ====================
add_header_p("6. TESTING & VALIDATION", level=1)

add_header_p("6.1 Test Cases Execution Table", level=2)
headers_test = ["Test ID", "Module", "Test Scenario & Input", "Expected Output", "Actual Output", "Status"]
data_test = [
    ["TC-01", "Database", "Connect to MySQL on port 3306 with blank password via pool", "Successful connection log 'MySQL connected successfully'", "Connected without timeout", "PASS"],
    ["TC-02", "Inventory", "Insert book with valid details (ISBN: 978-0111111111, Price: $14.50, Stock: 10)", "Book record inserted in Books; link row created in Book_Authors; HTTP 201", "Records saved in MySQL; UI list refreshed", "PASS"],
    ["TC-03", "Validation", "Insert book with duplicate ISBN (978-0451524935)", "HTTP 409 Conflict with error message 'ISBN already exists.'", "Error notification displayed; DB rejected", "PASS"],
    ["TC-04", "Validation", "Insert book with negative price (-12.00)", "Database CHECK (price > 0) constraint violation; HTTP 400", "Server error mapped: 'Price must be a positive number.'", "PASS"],
    ["TC-05", "Integrity", "Delete Category ID 1 (Fiction) containing active book rows", "Deletion aborted; HTTP 409 'Cannot delete: category contains books.'", "Record preserved; historical integrity maintained", "PASS"],
    ["TC-06", "Co-Authorship", "Query book with multiple authors (Book ID 7)", "GROUP_CONCAT aggregates both authors into 'Gabriel García Márquez, Neil Gaiman'", "Comma-separated string returned cleanly", "PASS"],
    ["TC-07", "POS Sale", "Process sale for 2 copies of book with stock = 10", "Order & Order_Items created; book stock decrements to 8; HTTP 201", "Stock decremented atomically; success toast", "PASS"],
    ["TC-08", "Order Mgmt", "Cancel completed order containing 2 units of Book ID 1", "Order status set to 'Cancelled'; Book stock increments by 2", "Status updated; inventory restored atomically", "PASS"],
    ["TC-09", "Reports", "Execute Report 9 (Books Above Average Price)", "Returns only books where price > (SELECT AVG(price))", "9 books priced above $14.63 average returned", "PASS"],
    ["TC-10", "Reports", "Export Category Sales report to CSV format", "Browser downloads .csv containing headers and table data", "category-sales.csv downloaded and validated", "PASS"]
]
tbl_test = doc.add_table(rows=len(data_test) + 1, cols=6)
style_table(tbl_test, [Inches(0.7), Inches(0.9), Inches(1.8), Inches(1.4), Inches(1.2), Inches(0.5)], headers_test, data_test)

add_header_p("6.2 Error Handling Architecture", level=2)
doc.add_paragraph(
    "The application incorporates defense-in-depth error handling across both client and server tiers:\n"
    "1. Centralized MySQL Code Mapping: The Express middleware (backend/middleware/errorHandler.js) intercepts database driver errors and maps native codes to human-friendly feedback:\n"
    "   • ER_DUP_ENTRY (Code 1062): Dissects the SQL message to alert the user specifically on duplicate ISBN, email, or phone numbers.\n"
    "   • ER_ROW_IS_REFERENCED_2 (Code 1451): Intercepts foreign key restriction errors, preventing deletion of authors or categories with linked records.\n"
    "   • ER_CHECK_CONSTRAINT_VIOLATED (Code 3819): Blocks negative pricing, negative stock quantities, and zero cart quantities.\n"
    "2. Atomic Rollback Guarantees: All POS checkouts and order cancellations execute inside explicit database transactions. If any check fails, `conn.rollback()` executes immediately, preventing partial data persistence."
)

# ==================== SECTION 7 ====================
add_header_p("7. CONCLUSION & FUTURE ENHANCEMENTS", level=1)

add_header_p("7.1 Conclusion", level=2)
doc.add_paragraph(
    "The Shelf & Co. Bookstore Management System successfully satisfies all requirements specified for the Database Systems Mini Project. "
    "The project demonstrates a robust, normalized (3NF) relational database implemented in MySQL 8.0, an asynchronous REST API backend "
    "utilizing parameterized queries and atomic transactions, and an accessible, editorial desktop frontend. "
    "Through its comprehensive query implementation—demonstrating multi-table joins, Many-to-Many co-authorship resolution via associative bridge tables, "
    "scalar and set-membership subqueries, aggregate metrics, and HAVING group filters—the system bridges academic database theory with production-grade application engineering."
)

add_header_p("7.2 Future Enhancements", level=2)
doc.add_paragraph(
    "1. Role-Based Access Control (RBAC): Introduce distinct user roles (Store Manager vs. Cashier) where managers have full catalog editing and financial reporting access, while cashiers are restricted to POS checkout and stock lookup.\n"
    "2. Multi-Author Interactive Editor: Expand the book creation UI with dynamic multi-select tags allowing cashiers to associate unlimited co-authors and assign custom contributor roles (e.g., Illustrator, Translator, Editor) per title.\n"
    "3. Barcode Scanner & Hardware Receipt Printing: Integrate Web USB/Serial APIs to scan ISBN barcodes directly into the POS cart and issue ESC/POS thermal receipts.\n"
    "4. Automated Purchase Order Procurement: Add a `Suppliers` entity and an automated procurement module that drafts purchase order requests whenever a title crosses below its configurable low-stock threshold."
)

output_path = r"C:\Users\Mallika Naik\.gemini\antigravity\scratch\shelf-and-co\Shelf_and_Co_Database_Systems_Project_Report.docx"
doc.save(output_path)
print("SUCCESS: Document created at", output_path)
