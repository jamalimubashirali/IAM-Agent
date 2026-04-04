package com.enterprise.iam;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableCaching
@EnableAsync
public class IamSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(IamSystemApplication.class, args);
    }

}
