package com.edutech.model;

import lombok.Data;

@Data
public class Result {
    private String id;
    private String student_id;
    private String student_name;
    private String exam_id;
    private String exam_title;
    private int score;
    private int total_questions;
    private String submitted_at;
}
