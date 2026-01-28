# API Documentation

Base URL: `http://localhost:8080/api`

## Authentication

### Login
**POST** `/login`

Authenticates a user and establishes a session.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "role": "ADMIN|STUDENT"
  }
}
```

### Check Session
**GET** `/login`

Checks if the current user is logged in.

**Response (Logged In):**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "username": "string",
    "role": "ADMIN|STUDENT"
  }
}
```

**Response (Not Logged In):**
```json
{
  "success": false,
  "message": "Not logged in"
}
```

### Logout
**POST** `/logout`

Invalidates the session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## User Management (Admin Only)

### List Users
**GET** `/users`

Returns a list of all student users.

**Response:**
```json
[
  {
    "id": "string",
    "username": "string",
    "role": "STUDENT"
  }
]
```

### Create User
**POST** `/users`

Creates a new student user.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "string",
  "message": "User created successfully"
}
```

### Delete User
**DELETE** `/users/{userId}`

Deletes a student user.

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Exams

### List Exams
**GET** `/exams`

Lists all available exams.

**Response:**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "durationMinutes": 123
    // "questions" included if Admin
  }
]
```

### Get Exam Details
**GET** `/exams/{examId}`

Gets details for a specific exam.

**Response:**
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "durationMinutes": 123,
  "questions": [
    {
      "id": "string",
      "exam_id": "string",
      "text": "string",
      "options": [
        {
          "id": "string",
          "text": "string"
        }
      ],
      "correct_option_id": "string" // hidden for STUDENT
    }
  ]
}
```

### Create Exam (Admin Only)
**POST** `/exams`

Creates a new exam.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "durationMinutes": 123,
  "questions": [
    {
      "text": "string",
      "options": [
        { "text": "Option A" },
        { "text": "Option B" },
        { "text": "Option C" },
        { "text": "Option D" }
      ],
      "correctOptionId": "ending in -o1, -o2, -o3, or -o4" 
      // Note: The input format for correctOptionId in creation is handled by matching suffixes in the code logic
    }
  ]
}
```

### Submit Exam (Student Only)
**POST** `/exams/submit/{examId}`

Submits exam answers.

**Request Body:**
```json
{
  "questionId_1": "selectedOptionId",
  "questionId_2": "selectedOptionId"
}
```

**Response:**
```json
{
  "id": "string",
  "student_id": "string",
  "student_name": "string",
  "exam_id": "string",
  "exam_title": "string",
  "score": 10,
  "total_questions": 20,
  "submitted_at": "timestamp"
}
```

### Get All Results (Admin Only)
**GET** `/exams/results`

Gets all exam results.

**Response:**
```json
[
  {
    "id": "string",
    "student_id": "string",
    "student_name": "string",
    "exam_id": "string",
    "exam_title": "string",
    "score": 10,
    "total_questions": 20,
    "submitted_at": "timestamp"
  }
]
```
