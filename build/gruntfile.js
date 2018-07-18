module.exports = function(grunt){
	grunt.initConfig({
		pkg:grunt.file.readJSON('package.json'),
		
		// Compile Angular Templates
		ngtemplates:  {
		  app:        {
			cwd:	  '../src/templates',	
			src:      '**.html',
			dest:     'template.js',
			options:  {
			  module: 'dynamicCal',
			  //usemin: 'ngCal.js'
			}
		  }
		},
		
		// Compile the entire Angular
		concat:   {
		  app:    {
			//src:  [ '../src/directives/**.js', '../src/services/**.js', '../src/filters/**.js', '<%= ngtemplates.app.dest %>' ],
			src:  [ '../src/directives/**.js', '../src/services/**.js', '../src/filters/**.js', '../templates/**.js','<%= ngtemplates.app.dest %>' ],
			dest: '../dist/ngDynamicCal.js'
		  }
		},
		copy: {
		  main: {
			src: '../src/main.css',
			dest: '../dist/ngDynamicCal.css'
		  }
		},
		cssmin: {
		  options: {
			shorthandCompacting: false,
			roundingPrecision: -1
		  },
		  target: {
			files: {
			  '../dist/ngDynamicCal.min.css': ['../dist/ngDynamicCal.css']
			}
		  }
		},
		// Minify
		uglify: {
		  my_target: {
		    files: {
			  '../dist/ngDynamicCal.min.js': ['../dist/ngDynamicCal.js']
		    }
		  }
	    }
	});
	grunt.loadNpmTasks('grunt-angular-templates');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.registerTask("default", ["ngtemplates", "concat", "copy", "cssmin", "uglify"]);
	
	
	
}