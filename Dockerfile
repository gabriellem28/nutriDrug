# 1. תמונת בסיס עם Node
FROM node:18

# 2. תקיית עבודה בתוך המיכל
WORKDIR /app

# 3. התקנת התלויות (npm install)
COPY package*.json ./
RUN npm install

# 4. העתקת כל שאר הקבצים (הקוד שלך)
COPY . .

# 5. הגדרת פורט שבו השרת יאזין (3000)
EXPOSE 3000

# 6. הפעלת האפליקציה
CMD ["npm", "start"]
