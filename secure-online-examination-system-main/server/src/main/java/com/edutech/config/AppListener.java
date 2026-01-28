package com.edutech.config;

import com.edutech.db.DatabaseManager;
import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

@WebListener
public class AppListener implements ServletContextListener {
    @Override
    public void contextInitialized(ServletContextEvent sce) {
        System.out.println(">> Server Starting... Initializing DB.");
        DatabaseManager.init();
    }

    @Override
    public void contextDestroyed(ServletContextEvent sce) {
        DatabaseManager.close();
    }
}
