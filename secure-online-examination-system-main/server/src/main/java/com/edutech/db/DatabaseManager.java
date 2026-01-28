package com.edutech.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager {
    private static HikariDataSource dataSource;
    private static String adminPasswd;

    public static void init() {
        // get data from envrimonet variable for production
        String url = System.getenv("DB_URL");
        String user = System.getenv("DB_USERNAME");        
        String pass = System.getenv("DB_PASSWORD");
        adminPasswd = System.getenv("Admin_passwd");
        
        // Default fallback for local development if env vars are missing
        if (url == null) {
            url = "jdbc:mysql://localhost:3306/exam_system_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
            user = "root";
            pass = "exam_system_passwd";
            adminPasswd = "admin123";
        }
            
        HikariConfig config = new HikariConfig();
        // MySQL Configuration
        config.setJdbcUrl(url);
        config.setUsername(user);
        config.setPassword(pass);

        if (url.contains("mysql")) {
            config.setDriverClassName("com.mysql.cj.jdbc.Driver");
            // for MySQL only
            config.addDataSourceProperty("cachePrepStmts", "true");
            config.addDataSourceProperty("prepStmtCacheSize", "250");
            config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        } else if (url.contains("sqlserver")) {
            config.setDriverClassName("com.microsoft.sqlserver.jdbc.SQLServerDriver");
        };

        dataSource = new HikariDataSource(config);
        
        createTables();
        seedAdmin();
    }

    public static Connection getConnection() throws SQLException {
        return dataSource.getConnection();
    }

    public static void close() {
        if (dataSource != null) dataSource.close();
    }

    private static void createTables() {
        String url = System.getenv("DB_URL");
        boolean isMSSQL = (url != null && url.contains("sqlserver"));
    
        try (Connection conn = getConnection(); Statement stmt = conn.createStatement()) {
            
            // 1. USERS TABLE
            if (isMSSQL) {
                stmt.execute("IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'users') " +
                    "CREATE TABLE users (id VARCHAR(36) PRIMARY KEY, username VARCHAR(50) UNIQUE, " +
                    "password VARCHAR(255), role VARCHAR(20))");
            } else {
                stmt.execute("CREATE TABLE IF NOT EXISTS users (id VARCHAR(36) PRIMARY KEY, " +
                    "username VARCHAR(50) UNIQUE, password VARCHAR(255), role VARCHAR(20))");
            }
    
            // 2. EXAMS TABLE (Using NVARCHAR(MAX) for MSSQL instead of TEXT)
            String textField = isMSSQL ? "NVARCHAR(MAX)" : "TEXT";
            String ifNotExistsExams = isMSSQL ? 
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'exams') " : "CREATE TABLE IF NOT EXISTS ";
            
            stmt.execute(ifNotExistsExams + "exams (id VARCHAR(36) PRIMARY KEY, title VARCHAR(255), " +
                "description " + textField + ", duration_minutes INT)");
    
            // 3. QUESTIONS TABLE
            String ifNotExistsQuestions = isMSSQL ? 
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'questions') " : "CREATE TABLE IF NOT EXISTS ";
            
            stmt.execute(ifNotExistsQuestions + "questions (id VARCHAR(36) PRIMARY KEY, exam_id VARCHAR(36), " +
                "text " + textField + ", FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE)");
    
            // 4. OPTIONS TABLE (BOOLEAN vs BIT)
            String boolType = isMSSQL ? "BIT DEFAULT 0" : "BOOLEAN DEFAULT FALSE";
            String ifNotExistsOptions = isMSSQL ? 
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'options') " : "CREATE TABLE IF NOT EXISTS ";
            
            stmt.execute(ifNotExistsOptions + "options (id VARCHAR(36) PRIMARY KEY, question_id VARCHAR(36), " +
                "text VARCHAR(255), is_correct " + boolType + ", " +
                "FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE)");
    
            // 5. RESULTS TABLE (TIMESTAMP vs DATETIME)
            String timeType = isMSSQL ? "DATETIME DEFAULT GETDATE()" : "TIMESTAMP DEFAULT CURRENT_TIMESTAMP";
            String ifNotExistsResults = isMSSQL ? 
                "IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'results') " : "CREATE TABLE IF NOT EXISTS ";
            
            stmt.execute(ifNotExistsResults + "results (id VARCHAR(36) PRIMARY KEY, student_id VARCHAR(36), " +
                "exam_id VARCHAR(36), score INT, total_questions INT, submitted_at " + timeType + ")");
                
            System.out.println(">> Tables Verified/Created for " + (isMSSQL ? "MSSQL" : "MySQL"));
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }

    private static void seedAdmin() {
        String url = System.getenv("DB_URL");
        boolean isMSSQL = (url != null && url.contains("sqlserver"));
    
        try (Connection conn = getConnection()) {
            String hash = BCrypt.hashpw(adminPasswd, BCrypt.gensalt());
            String sql;
    
            if (isMSSQL) {
                // SQL Server check before insert
                sql = "IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin') " +
                      "INSERT INTO users (id, username, password, role) VALUES ('admin-uuid', 'admin', ?, 'ADMIN')";
            } else {
                // MySQL syntax
                sql = "INSERT INTO users (id, username, password, role) " +
                      "VALUES ('admin-uuid', 'admin', ?, 'ADMIN') ON DUPLICATE KEY UPDATE username=username";
            }
            
            var ps = conn.prepareStatement(sql);
            ps.setString(1, hash);
            ps.executeUpdate();
            System.out.println("password: "+adminPasswd); 
            System.out.println(">> Admin account checked.");
        } catch (Exception e) { 
            e.printStackTrace(); 
        }
    }
}