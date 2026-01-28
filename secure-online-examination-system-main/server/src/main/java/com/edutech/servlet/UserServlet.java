package com.edutech.servlet;

import com.edutech.db.DatabaseManager;
import com.edutech.model.User;
import com.edutech.util.JsonUtil;
import org.mindrot.jbcrypt.BCrypt;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.util.*;

@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {

    private boolean isAdmin(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if(session == null) return false;
        User u = (User) session.getAttribute("user");
        return u != null && "ADMIN".equals(u.getRole());
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }

        List<Map<String, String>> users = new ArrayList<>();
        try (Connection conn = DatabaseManager.getConnection()) {
            ResultSet rs = conn.createStatement().executeQuery("SELECT id, username, role FROM users WHERE role = 'STUDENT'");
            while (rs.next()) {
                Map<String, String> u = new HashMap<>();
                u.put("id", rs.getString("id"));
                u.put("username", rs.getString("username"));
                u.put("role", rs.getString("role"));
                users.add(u);
            }
        } catch (SQLException e) { e.printStackTrace(); }
        JsonUtil.sendJson(resp, users);
    }

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }

        Map<String, String> body = JsonUtil.parseBody(req, Map.class);
        String uuid = UUID.randomUUID().toString();
        String hashedPassword = BCrypt.hashpw(body.get("password"), BCrypt.gensalt());

        try (Connection conn = DatabaseManager.getConnection()) {
            PreparedStatement ps = conn.prepareStatement("INSERT INTO users (id, username, password, role) VALUES (?, ?, ?, 'STUDENT')");
            ps.setString(1, uuid);
            ps.setString(2, body.get("username"));
            ps.setString(3, hashedPassword);
            ps.executeUpdate();
            
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("userId", uuid);
            res.put("message", "User created successfully");
            JsonUtil.sendJson(resp, res);
        } catch (SQLException e) {
            resp.setStatus(500);
            Map<String, String> err = new HashMap<>();
            err.put("error", "Username likely exists");
            JsonUtil.sendJson(resp, err);
        }
    }

    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        if (!isAdmin(req)) { resp.setStatus(403); return; }
        
        String path = req.getPathInfo();
        if (path == null || path.length() < 2) return;
        String userId = path.substring(1);

        try (Connection conn = DatabaseManager.getConnection()) {
            PreparedStatement ps = conn.prepareStatement("DELETE FROM users WHERE id = ?");
            ps.setString(1, userId);
            ps.executeUpdate();
            
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("message", "User deleted successfully");
            JsonUtil.sendJson(resp, res);
        } catch (SQLException e) { e.printStackTrace(); }
    }
}
