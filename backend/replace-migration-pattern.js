const fs = require('fs');
const path = require('path');

// Specify the path to the compiled DataSourceService.js file
const filePath = path.join(__dirname, 'dist', 'dataSource', 'DataSourceService.js');

// Read the content of the compiled JS file
fs.readFile(filePath, 'utf8', (err, data) => {
	if (err) {
		return console.log(`Error reading file: ${err}`);
	}

	// Replace the migration path for production use
	const result = data.replace(
		"'src/migrations/*.ts'",
		"'dist/migrations/*.js'"
	);

	// Write the modified content back to the file
	fs.writeFile(filePath, result, 'utf8', (err) => {
		if (err) return console.log(`Error writing file: ${err}`);
		console.log('The migration path has been updated successfully.');
	});
});
