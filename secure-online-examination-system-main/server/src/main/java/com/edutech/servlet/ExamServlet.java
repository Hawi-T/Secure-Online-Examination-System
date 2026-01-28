package com.edutech.servlet;

import com.edutech.db.DatabaseManager;
import com.edutech.model.*;
import com.edutech.util.JsonUtil;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;

@WebServlet(urlPatterns = {"/api/exams/*", "/api/exams/submit/*", "/api/exams/results"})
public class ExamServlet extends HttpServlet {

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String path = req.getPathInfo();
        HttpSession session = req.getSession(false);
        User currentUser = (session != null) ? (User) session.getAttribute("user") : null;
        
        if (currentUser == null) { 
            resp.setStatus(401); 
            return; 
        }
    
        try (Connection conn = DatabaseManager.getConnection()) {
            // --- RESULTS LOGIC ---
            if (req.getRequestURI().contains("/results")) {
                String studentIdParam = req.getParameter("studentId");
    
                if ("ADMIN".equals(currentUser.getRole())) {
                    // Admin can see everyone (studentIdParam might be null)
                    handleGetResults(conn, resp, studentIdParam);
                } 
                else if ("STUDENT".equals(currentUser.getRole())) {
                    // Student MUST provide a studentId AND it must match their own ID
                    if (studentIdParam != null && studentIdParam.equals(currentUser.getId())) {
                        handleGetResults(conn, resp, currentUser.getId());
                    } else {
                        resp.setStatus(403); // Forbidden: Trying to see someone else's or no ID
                    }
                }
                return;
            }
    
            // --- EXAM LIST/DETAILS LOGIC ---
            if (path == null || path.equals("/")) {
                handleListExams(conn, resp);
            } else {
                String examId = path.substring(1);
                handleGetExamDetails(conn, resp, examId, currentUser.getRole());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            resp.sendError(500);
        }
    }

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();
        HttpSession session = req.getSession(false);
        User currentUser = (session != null) ? (User) session.getAttribute("user") : null;

        if (currentUser == null) { resp.setStatus(401); return; }

        try (Connection conn = DatabaseManager.getConnection()) {
            if (uri.contains("/submit")) {
                String[] parts = uri.split("/");
                String examId = parts[parts.length - 1]; 
                handleSubmitExam(conn, req, resp, examId, currentUser);
            } else {
                if (!"ADMIN".equals(currentUser.getRole())) { resp.setStatus(403); return; }
                handleCreateExam(conn, req, resp);
            }
        } catch (SQLException e) {
            e.printStackTrace();
            resp.sendError(500, e.getMessage());
        }
    }

    private void handleListExams(Connection conn, HttpServletResponse resp) throws SQLException, IOException {
        List<Exam> exams = new ArrayList<>();
        ResultSet rs = conn.createStatement().executeQuery("SELECT * FROM exams");
        while (rs.next()) {
            Exam e = new Exam();
            e.setId(rs.getString("id"));
            e.setTitle(rs.getString("title"));
            e.setDescription(rs.getString("description"));
            e.setDurationMinutes(rs.getInt("duration_minutes"));
            exams.add(e);
        }
        JsonUtil.sendJson(resp, exams);
    }

    private void handleGetExamDetails(Connection conn, HttpServletResponse resp, String examId, String role) throws SQLException, IOException {
        PreparedStatement ps = conn.prepareStatement("SELECT * FROM exams WHERE id = ?");
        ps.setString(1, examId);
        ResultSet rs = ps.executeQuery();
        if (!rs.next()) { resp.setStatus(404); return; }
        
        Exam exam = new Exam();
        exam.setId(rs.getString("id"));
        exam.setTitle(rs.getString("title"));
        exam.setDescription(rs.getString("description"));
        exam.setDurationMinutes(rs.getInt("duration_minutes"));

        List<Question> questions = new ArrayList<>();
        PreparedStatement psQ = conn.prepareStatement("SELECT * FROM questions WHERE exam_id = ?");
        psQ.setString(1, examId);
        ResultSet rsQ = psQ.executeQuery();
        
        while (rsQ.next()) {
            Question q = new Question();
            q.setId(rsQ.getString("id"));
            q.setText(rsQ.getString("text"));
            q.setExam_id(examId);
            
            if ("ADMIN".equals(role)) {
                q.setCorrect_option_id(rsQ.getString("correct_option_id"));
            }

            List<Option> options = new ArrayList<>();
            PreparedStatement psO = conn.prepareStatement("SELECT * FROM options WHERE question_id = ?");
            psO.setString(1, q.getId());
            ResultSet rsO = psO.executeQuery();
                
            while (rsO.next()) {
                // Use No-Args constructor and setters to avoid constructor mismatches
                Option option = new Option();
                option.setId(rsO.getString("id"));
                option.setQuestion_id(rsO.getString("question_id"));
                option.setText(rsO.getString("text"));
                option.setCorrect(rsO.getBoolean("is_correct")); // Important for the frontend
                
                options.add(option);
            }
            q.setOptions(options);
            questions.add(q);
        }
        exam.setQuestions(questions);
        JsonUtil.sendJson(resp, exam);
    }
        
    private void handleCreateExam(Connection conn, HttpServletRequest req, HttpServletResponse resp) throws IOException, SQLException {
        Exam examReq = JsonUtil.parseBody(req, Exam.class);
        String examId = UUID.randomUUID().toString();
    
        conn.setAutoCommit(false); 
        try {
            // 1. Insert Exam
            PreparedStatement psExam = conn.prepareStatement(
                "INSERT INTO exams (id, title, description, duration_minutes) VALUES (?, ?, ?, ?)");
            psExam.setString(1, examId);
            psExam.setString(2, examReq.getTitle());
            psExam.setString(3, examReq.getDescription());
            psExam.setInt(4, examReq.getDurationMinutes());
            psExam.executeUpdate();
    
            for (Question q : examReq.getQuestions()) {
                String qId = UUID.randomUUID().toString();
    
                // 2. Insert Question (Clean & Simple)
                PreparedStatement psQ = conn.prepareStatement(
                    "INSERT INTO questions (id, exam_id, text) VALUES (?, ?, ?)");
                psQ.setString(1, qId);
                psQ.setString(2, examId);
                psQ.setString(3, q.getText());
                psQ.executeUpdate();
    
                // 3. Insert Options with correct flag
                for (int i = 0; i < q.getOptions().size(); i++) {
                    Option opt = q.getOptions().get(i);
                    String oId = UUID.randomUUID().toString();
                    
                    PreparedStatement psOpt = conn.prepareStatement(
                        "INSERT INTO options (id, question_id, text, is_correct) VALUES (?, ?, ?, ?)");
                    psOpt.setString(1, oId);
                    psOpt.setString(2, qId);
                    psOpt.setString(3, opt.getText());
                    
                    // Logic: Mark as correct if it's the first option (or based on your logic)
                    psOpt.setBoolean(4, (i == 0)); 
                    
                    psOpt.executeUpdate();
                }
            }
            conn.commit();
            
            JsonUtil.sendJson(resp, Map.of("success", true, "message", "Exam created via clean schema"));
        } catch (Exception e) {
            conn.rollback();
            e.printStackTrace();
            resp.sendError(500, "Database error: " + e.getMessage());
        } finally {
            conn.setAutoCommit(true);
        }
    }

    private void handleSubmitExam(Connection conn, HttpServletRequest req, HttpServletResponse resp, String examId, User user) throws IOException, SQLException {
        Map<String, String> answers = JsonUtil.parseBody(req, Map.class);
        
        int score = 0;
        int total = 0;
        String examTitle = "Unknown";
    
        // 1. Get Exam Title
        PreparedStatement psEx = conn.prepareStatement("SELECT title FROM exams WHERE id = ?");
        psEx.setString(1, examId);
        ResultSet rsEx = psEx.executeQuery();
        if (rsEx.next()) examTitle = rsEx.getString("title");
    
        // 2. Fetch all questions for this exam
        PreparedStatement psQ = conn.prepareStatement("SELECT id FROM questions WHERE exam_id = ?");
        psQ.setString(1, examId);
        ResultSet rsQ = psQ.executeQuery();
        
        while (rsQ.next()) {
            total++;
            String qId = rsQ.getString("id");
            String studentAnswerOptionId = answers.get(qId);
            
            if (studentAnswerOptionId != null) {
                // 3. Verify if the submitted option ID is marked as correct for this specific question
                PreparedStatement psCheck = conn.prepareStatement(
                    "SELECT is_correct FROM options WHERE id = ? AND question_id = ?");
                psCheck.setString(1, studentAnswerOptionId);
                psCheck.setString(2, qId);
                ResultSet rsCheck = psCheck.executeQuery();
                
                if (rsCheck.next()) {
                    if (rsCheck.getBoolean("is_correct")) {
                        score++;
                    }
                }
            }
        }
    
        // 4. Save to Database
        String resId = UUID.randomUUID().toString();
        PreparedStatement psIns = conn.prepareStatement(
            "INSERT INTO results (id, student_id, exam_id, score, total_questions, submitted_at) VALUES (?, ?, ?, ?, ?, ?)");
        psIns.setString(1, resId);
        psIns.setString(2, user.getId());
        psIns.setString(3, examId);
        psIns.setInt(4, score);
        psIns.setInt(5, total);
        psIns.setTimestamp(6, Timestamp.valueOf(LocalDateTime.now()));
        psIns.executeUpdate();
    
        // 5. Send Response back to Student
        Result result = new Result();
        result.setId(resId);
        result.setStudent_id(user.getId());
        result.setStudent_name(user.getUsername());
        result.setExam_id(examId);
        result.setExam_title(examTitle);
        result.setScore(score);
        result.setTotal_questions(total);
        result.setSubmitted_at(LocalDateTime.now().toString());
        
        JsonUtil.sendJson(resp, result);
    }
    private void handleGetResults(Connection conn, HttpServletResponse resp, String studentId) throws SQLException, IOException {
        List<Result> results = new ArrayList<>();
        
        // 1. Base SQL query
        StringBuilder sql = new StringBuilder(
            "SELECT r.*, u.username, e.title " +
            "FROM results r " +
            "JOIN users u ON r.student_id = u.id " +
            "JOIN exams e ON r.exam_id = e.id"
        );
    
        // 2. Add filter if studentId is provided
        if (studentId != null && !studentId.isEmpty()) {
            sql.append(" WHERE r.student_id = ?");
        }
        
        sql.append(" ORDER BY r.submitted_at DESC");
    
        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            if (studentId != null && !studentId.isEmpty()) {
                ps.setString(1, studentId);
            }
    
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Result res = new Result();
                    res.setId(rs.getString("id"));
                    res.setStudent_id(rs.getString("student_id"));
                    res.setStudent_name(rs.getString("username"));
                    res.setExam_id(rs.getString("exam_id"));
                    res.setExam_title(rs.getString("title"));
                    res.setScore(rs.getInt("score"));
                    res.setTotal_questions(rs.getInt("total_questions"));
                    res.setSubmitted_at(rs.getString("submitted_at"));
                    results.add(res);
                }
            }
        }
        JsonUtil.sendJson(resp, results);
    }
}
