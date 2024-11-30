# generate_csv.py
import csv
from faker import Faker

def generate_csv(file_name, num_rows):
    faker = Faker()
    with open(file_name, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Column1', 'Column2', 'Column3', 'Column4', 'Column5', 'Column6', 'Column7'])
        for _ in range(num_rows):
            row = [faker.text(max_nb_chars=20) for _ in range(7)]
            writer.writerow(row)

# Generate a CSV file with 15,000 rows
generate_csv('fake_data_1k.csv', 1000)