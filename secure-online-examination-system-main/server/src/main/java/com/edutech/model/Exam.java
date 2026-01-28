package com.edutech.model;

import lombok.Data;
import java.util.List;

@Data
public class Exam {
    private String id;
    private String title;
    private String description;
    private int durationMinutes;
    private List<Question> questions;
}
