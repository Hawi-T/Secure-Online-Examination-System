package com.edutech.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class Question {
    private String id;
    private String exam_id;
    private String text;
    private List<Option> options;
    private String correct_option_id;
    private Integer correctOptionIndex;
}
