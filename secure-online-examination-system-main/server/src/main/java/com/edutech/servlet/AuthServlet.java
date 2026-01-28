package com.edutech.servlet;

import com.edutech.db.DatabaseManager;
import com.edutech.model.User;
import com.edutech.util.JsonUtil;
import org.mindrot.jbcrypt.BCrypt;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.*;
import java.util.HashMap;
import java.util.Map;

@WebServlet(urlPatterns = {"/api/login", "/api/logout"})
public class AuthServlet extends HttpServlet {

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String uri = req.getRequestURI();
        
        if (uri.endsWith("/logout")) {
            req.getSession().invalidate();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Logged out successfully");
            JsonUtil.sendJson(resp, response);
            return;
        }

        // Login Logic
        try {
            Map<String, String> creds = JsonUtil.parseBody(req, Map.class);
            String username = creds.get("username");
            String password = creds.get("password");

            try (Connection conn = DatabaseManager.getConnection()) {
                PreparedStatement ps = conn.prepareStatement("SELECT * FROM users WHERE username = ?");
                ps.setString(1, username);
                ResultSet rs = ps.executeQuery();

                if (rs.next() && BCrypt.checkpw(password, rs.getString("password"))) {
                    User user = new User(rs.getString("id"), rs.getString("username"), null, rs.getString("role"));
                    
                    HttpSession session = req.getSession(true);
                    session.setAttribute("user", user);
                    
                    // Set timeout to 30 mins
                    session.setMaxInactiveInterval(30 * 60);

                    Map<String, Object> res = new HashMap<>();
                    res.put("success", true);
                    res.put("user", user);
                    JsonUtil.sendJson(resp, res);
                } else {
                    resp.setStatus(401);
                    Map<String, Object> res = new HashMap<>();
                    res.put("success", false);
                    res.put("message", "Invalid credentials");
                    JsonUtil.sendJson(resp, res);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.sendError(400, "Invalid Request Format");
        }
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        Map<String, Object> res = new HashMap<>();
        
        if (session != null && session.getAttribute("user") != null) {
            res.put("success", true);
            res.put("user", session.getAttribute("user"));
        } else {
            res.put("success", false);
            res.put("message", "Not logged in");
        }
        JsonUtil.sendJson(resp, res);
    }
}
