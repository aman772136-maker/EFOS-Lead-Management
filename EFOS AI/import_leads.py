import csv
import sqlite3
import random
import os

# Define data options
courses = ['B.Tech (CS)', 'B.Tech (AI/ML)', 'MCA', 'M.Tech', 'BCA', 'B.Sc IT', 'BTech']
sources = ['WhatsApp Campaign', 'LinkedIn', 'Website Direct', 'Instagram Ad', 'Referral', 'Telegram']
purposes = ['Summer Internship', 'Full-Time Internship', 'Project Guidance', 'Course Inquiry']
statuses = ['Contacted', 'Qualified', 'Rejected', 'Enrolled', 'Pending Review']
first_names = ['Aman', 'Rohit', 'Priya', 'Sneha', 'Rahul', 'Ananya', 'Vikas', 'Kiran', 'Deepak', 'Pooja', 'Aditya', 'Neha']
last_names = ['Kumar', 'Sharma', 'Singh', 'Verma', 'Gupta', 'Patel', 'Yadav', 'Mishra', 'Joshi', 'Mehta']
cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata']
qualifications = ['12th Completed', 'Graduate', 'Undergraduate', 'Post Graduate']

data = []

# Database Path
db_path = r"C:\Users\aman7\Downloads\EFOS AI\EFOS AI\database\leads.db"

# Create database directory if it doesn't exist
db_dir = os.path.dirname(db_path)
if not os.path.exists(db_dir):
    os.makedirs(db_dir)

# Connect to SQLite
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Ensure leads table exists (in case it wasn't initialized)
cursor.execute('''
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT DEFAULT NULL,
    qualification TEXT DEFAULT NULL,
    source TEXT DEFAULT 'website',
    course_interest TEXT DEFAULT NULL,
    status TEXT DEFAULT 'New',
    lead_score INTEGER DEFAULT 0,
    score_category TEXT DEFAULT NULL,
    website_visits INTEGER DEFAULT 0,
    brochure_downloaded BOOLEAN DEFAULT 0,
    age INTEGER DEFAULT NULL,
    last_message TEXT DEFAULT NULL,
    last_message_channel TEXT DEFAULT NULL,
    last_message_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
''')
conn.commit()

# Generate 1000 leads
for i in range(1, 1001):
    fname = random.choice(first_names)
    lname = random.choice(last_names)
    name = f"{fname} {lname}"
    email = f"{fname.lower()}.{lname.lower()}{random.randint(10, 99)}@gmail.com"
    course = random.choice(courses)
    source = random.choice(sources)
    purpose = random.choice(purposes)
    status = random.choice(statuses)
    
    # Extra fields for database
    phone = f"+91 {random.randint(60000, 99999)} {random.randint(10000, 99999)}"
    city = random.choice(cities)
    qualification = random.choice(qualifications)
    age = random.randint(16, 25)
    website_visits = random.randint(0, 5)
    brochure_downloaded = random.choice([0, 1])
    
    # Calculate Lead Score and Category based on exact scoringRules.json
    score = 0
    if qualification == '12th Completed':
        score += 20
    if 16 <= age <= 18:
        score += 25
    if course == 'BTech':
        score += 20
    if brochure_downloaded:
        score += 15
    if website_visits > 3:
        score += 20
        
    score = min(max(score, 0), 100)
    if score <= 40:
        category = 'Cold'
    elif score <= 70:
        category = 'Warm'
    else:
        category = 'Hot'
        
    data.append({
        'Lead_ID': f"INT_{1000+i}",
        'Name': name,
        'Email_ID': email,
        'Course': course,
        'Source': source,
        'Purpose_of_Visit': purpose,
        'Application_Status': status,
        
        # Extra DB fields
        'phone': phone,
        'city': city,
        'qualification': qualification,
        'age': age,
        'website_visits': website_visits,
        'brochure_downloaded': brochure_downloaded,
        'lead_score': score,
        'score_category': category
    })

# Write to CSV in the same folder
csv_file = os.path.join(os.path.dirname(db_path), "..", "internship_leads_data.csv")
csv_file = os.path.abspath(csv_file)
with open(csv_file, mode='w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['Lead_ID', 'Name', 'Email_ID', 'Course', 'Source', 'Purpose_of_Visit', 'Application_Status'])
    writer.writeheader()
    for row in data:
        writer.writerow({
            'Lead_ID': row['Lead_ID'],
            'Name': row['Name'],
            'Email_ID': row['Email_ID'],
            'Course': row['Course'],
            'Source': row['Source'],
            'Purpose_of_Visit': row['Purpose_of_Visit'],
            'Application_Status': row['Application_Status']
        })

# Insert into Database
insert_query = '''
INSERT INTO leads (name, email, phone, city, qualification, source, course_interest, status, lead_score, score_category, website_visits, brochure_downloaded, age)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
'''

db_records = [
    (
        row['Name'],
        row['Email_ID'],
        row['phone'],
        row['city'],
        row['qualification'],
        row['Source'],
        row['Course'],
        row['Application_Status'],
        row['lead_score'],
        row['score_category'],
        row['website_visits'],
        row['brochure_downloaded'],
        row['age']
    )
    for row in data
]

cursor.executemany(insert_query, db_records)
conn.commit()
conn.close()

print(f"Success: Generated CSV at '{csv_file}' and imported {len(data)} leads into SQLite database!")
