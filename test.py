import pandas as pd
import time

start = time.process_time()
df = pd.read_csv(
    "/Users/pedro/Downloads/FoodData_Central_csv_2023-10-26/branded_food.csv",
    low_memory=False,
)
end = time.process_time()
print(df)
print(start)
print(end)
print(end - start)
