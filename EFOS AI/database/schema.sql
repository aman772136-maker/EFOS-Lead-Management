CREATE DATABASE IF NOT EXISTS efos_leads;
USE efos_leads;

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  city VARCHAR(100) DEFAULT NULL,
  qualification VARCHAR(100) DEFAULT NULL,
  source ENUM('website','google_form','whatsapp','meta_ads','internship','referral') DEFAULT 'website',
  course_interest VARCHAR(255) DEFAULT NULL,
  status ENUM('New','Contacted','Interested','Follow-Up','Qualified','Enrolled','Rejected') DEFAULT 'New',
  lead_score INT DEFAULT 0,
  score_category VARCHAR(10) DEFAULT NULL,
  last_message TEXT DEFAULT NULL,
  last_message_channel VARCHAR(20) DEFAULT NULL,
  last_message_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
