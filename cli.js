const args = process.argv.slice(2);
let command = '';

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
        case 'dev':
            command = 'dev';
            break;
        case 'create':
            command = 'create';
            break;
        case 'build':
            command = 'build';
            break;
        case '-v':
        case '--version':
            // Note: Version would need to be hardcoded or retrieved differently
            console.log('1.0.0');
            process.exit(0);
        case '-h':
        case '--help':
            console.log(`
snelle - CLI for Snelle project

Commands:
  dev                     Start development server
  create                  Create a new Snelle project
  build                   Build the project for production
`);
            process.exit(0);
    }
}

switch (command) {
    case 'dev':
        try {
            await import('./dev.ts');
            // Add dev server implementation here
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
        break;
    case 'create':
        try {
            await import('./create.ts');
            // Add project creation implementation here
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
        break;
    case 'build':
        try {
            await import('./build.ts');
            // Add build implementation here
        } catch (error) {
            console.error('Error:', error.message);
            process.exit(1);
        }
        break;
}
