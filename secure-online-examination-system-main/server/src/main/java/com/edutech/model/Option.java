package com.edutech.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data 
@AllArgsConstructor 
@NoArgsConstructor
public class Option {
    private String id;
    private String text;
    private String question_id;
    private Boolean correct;
}
