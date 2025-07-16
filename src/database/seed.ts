import database from '../config/database';
import logger from '../utils/logger';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Database seeding script with comprehensive sample data
 * Optimized for performance with batch inserts and proper error handling
 * Provides realistic data for development and testing environments
 */
class DatabaseSeeder {
  /**
   * Runs the complete database seeding process
   * @returns {Promise<void>}
   */
  static async run(): Promise<void> {
    try {
      logger.info('Starting database seeding process...');
      
      // Read the SQL seed file
      const seedFilePath = join(__dirname, 'seed.sql');
      const seedSQL = readFileSync(seedFilePath, 'utf8');
      
      // Split the SQL into individual statements
      const statements = seedSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      logger.info(`Found ${statements.length} SQL statements to execute`);
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        try {
          if (statement) {
            await database.query(statement);
            logger.debug(`Executed statement ${i + 1}/${statements.length}`);
          }
        } catch (error) {
          logger.error(`Failed to execute statement ${i + 1}: ${statement?.substring(0, 100)}...`);
          throw error;
        }
      }
      
      logger.info('Database seeding completed successfully');
      
    } catch (error) {
      logger.error('Database seeding failed:', error as Error);
      throw error;
    }
  }

  /**
   * Seeds only specific data types
   * @param {string[]} dataTypes - Array of data types to seed ('instructors', 'members', 'classes', 'bookings')
   * @returns {Promise<void>}
   */
  static async seedSpecific(dataTypes: string[]): Promise<void> {
    try {
      logger.info(`Seeding specific data types: ${dataTypes.join(', ')}`);
      
      const seedFilePath = join(__dirname, 'seed.sql');
      const seedSQL = readFileSync(seedFilePath, 'utf8');
      
      // Extract specific sections based on data types
      const sections = this.extractSections(seedSQL, dataTypes);
      
      for (const section of sections) {
        const statements = section
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          await database.query(statement);
        }
      }
      
      logger.info('Specific data seeding completed successfully');
      
    } catch (error) {
      logger.error('Specific data seeding failed:', error as Error);
      throw error;
    }
  }

  /**
   * Extracts specific sections from the seed SQL
   * @param {string} seedSQL - The complete seed SQL
   * @param {string[]} dataTypes - Data types to extract
   * @returns {string[]} Array of SQL sections
   * @private
   */
  private static extractSections(seedSQL: string, dataTypes: string[]): string[] {
    const sections: string[] = [];
    const lines = seedSQL.split('\n');
    let currentSection = '';
    let inSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if this line starts a new section
      if (trimmedLine.startsWith('-- Insert ') || trimmedLine.startsWith('INSERT INTO ')) {
        const sectionType = this.getSectionType(trimmedLine);
        
        if (dataTypes.includes(sectionType)) {
          inSection = true;
          currentSection = line + '\n';
        } else {
          inSection = false;
          if (currentSection) {
            sections.push(currentSection);
            currentSection = '';
          }
        }
      } else if (inSection) {
        currentSection += line + '\n';
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }
    
    return sections;
  }

  /**
   * Determines the section type from a line
   * @param {string} line - The line to analyze
   * @returns {string} The section type
   * @private
   */
  private static getSectionType(line: string): string {
    if (line.includes('instructors')) return 'instructors';
    if (line.includes('members')) return 'members';
    if (line.includes('classes')) return 'classes';
    if (line.includes('bookings')) return 'bookings';
    if (line.includes('class_attendance')) return 'class_attendance';
    return 'unknown';
  }

  /**
   * Validates the seeded data
   * @returns {Promise<boolean>} True if validation passes
   */
  static async validate(): Promise<boolean> {
    try {
      logger.info('Validating seeded data...');
      
      const validations = [
        this.validateInstructors(),
        this.validateMembers(),
        this.validateClasses(),
        this.validateBookings()
      ];
      
      const results = await Promise.all(validations);
      const allValid = results.every(result => result);
      
      if (allValid) {
        logger.info('Data validation passed');
      } else {
        logger.warn('Data validation failed');
      }
      
      return allValid;
      
    } catch (error) {
      logger.error('Data validation failed:', error as Error);
      return false;
    }
  }

  /**
   * Validates instructor data
   * @returns {Promise<boolean>} True if validation passes
   * @private
   */
  private static async validateInstructors(): Promise<boolean> {
    try {
      const result = await database.query('SELECT COUNT(*) as count FROM instructors WHERE status = \'active\'');
      const count = parseInt(result.rows[0].count);
      logger.debug(`Found ${count} active instructors`);
      return count > 0;
    } catch (error) {
      logger.error('Instructor validation failed:', error as Error);
      return false;
    }
  }

  /**
   * Validates member data
   * @returns {Promise<boolean>} True if validation passes
   * @private
   */
  private static async validateMembers(): Promise<boolean> {
    try {
      const result = await database.query('SELECT COUNT(*) as count FROM members WHERE status = \'active\'');
      const count = parseInt(result.rows[0].count);
      logger.debug(`Found ${count} active members`);
      return count > 0;
    } catch (error) {
      logger.error('Member validation failed:', error as Error);
      return false;
    }
  }

  /**
   * Validates class data
   * @returns {Promise<boolean>} True if validation passes
   * @private
   */
  private static async validateClasses(): Promise<boolean> {
    try {
      const result = await database.query('SELECT COUNT(*) as count FROM classes WHERE status = \'active\'');
      const count = parseInt(result.rows[0].count);
      logger.debug(`Found ${count} active classes`);
      return count > 0;
    } catch (error) {
      logger.error('Class validation failed:', error as Error);
      return false;
    }
  }

  /**
   * Validates booking data
   * @returns {Promise<boolean>} True if validation passes
   * @private
   */
  private static async validateBookings(): Promise<boolean> {
    try {
      const result = await database.query('SELECT COUNT(*) as count FROM bookings');
      const count = parseInt(result.rows[0].count);
      logger.debug(`Found ${count} bookings`);
      return count > 0;
    } catch (error) {
      logger.error('Booking validation failed:', error as Error);
      return false;
    }
  }

  /**
   * Clears all seeded data
   * @returns {Promise<void>}
   */
  static async clear(): Promise<void> {
    try {
      logger.info('Clearing all seeded data...');
      
      const clearStatements = [
        'DELETE FROM class_attendance',
        'DELETE FROM bookings',
        'DELETE FROM classes',
        'DELETE FROM members',
        'DELETE FROM instructors'
      ];
      
      for (const statement of clearStatements) {
        await database.query(statement);
      }
      
      logger.info('All seeded data cleared successfully');
      
    } catch (error) {
      logger.error('Failed to clear seeded data:', error as Error);
      throw error;
    }
  }
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Database Seeder Usage:
  npm run seed                    # Seed all data
  npm run seed -- --clear         # Clear all data
  npm run seed -- --validate      # Validate seeded data
  npm run seed -- --types=instructors,classes  # Seed specific types
    `);
    process.exit(0);
  }
  
  (async () => {
    try {
      if (args.includes('--clear')) {
        await DatabaseSeeder.clear();
      } else if (args.includes('--validate')) {
        const isValid = await DatabaseSeeder.validate();
        process.exit(isValid ? 0 : 1);
      } else {
        const typesArg = args.find(arg => arg.startsWith('--types='));
        if (typesArg) {
          const types = typesArg.split('=')[1]?.split(',') || [];
          await DatabaseSeeder.seedSpecific(types);
        } else {
          await DatabaseSeeder.run();
        }
        
        // Validate after seeding
        const isValid = await DatabaseSeeder.validate();
        if (!isValid) {
          logger.warn('Data validation failed after seeding');
          process.exit(1);
        }
      }
    } catch (error) {
      logger.error('Seeding process failed:', error as Error);
      process.exit(1);
    }
  })();
}

export default DatabaseSeeder;