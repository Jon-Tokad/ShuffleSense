package com.boilermakexii.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.boilermakexii.backend.model.Song;

@RestController
public class Controller {

		@GetMapping("/song")
		public void getSong() {
			System.out.println("hi");
		}

}