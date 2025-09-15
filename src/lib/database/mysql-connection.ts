// 🚀 MOMINAI MYSQL DATABASE CONNECTION
// Replacing Supabase with MySQL for better control and performance

import mysql from 'mysql2/promise'

export interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
  connectionLimit: number
}

class MySQLDatabase {
  private pool: mysql.Pool | null = null
  private config: DatabaseConfig

  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'mominai_db',
      user: process.env.DB_USER || 'mominai_user',
      password: process.env.DB_PASSWORD || '',
      connectionLimit: 10
    }

    this.initializePool()
  }

  private async initializePool() {
    try {
      this.pool = mysql.createPool(this.config)
      console.log('✅ MySQL database connected successfully')

      // Test the connection
      const connection = await this.pool.getConnection()
      await connection.ping()
      connection.release()
      console.log('✅ MySQL connection test successful')
    } catch (error) {
      console.error('❌ MySQL connection failed:', error)
      throw error
    }
  }

  // Execute queries with proper error handling
  async query(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) throw new Error('Database not initialized')

    try {
      const [rows] = await this.pool.execute(sql, params)
      return rows
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  // Get a single row
  async queryOne(sql: string, params: any[] = []): Promise<any> {
    const rows = await this.query(sql, params)
    return rows[0] || null
  }

  // Transaction support
  async transaction(callback: (connection: mysql.PoolConnection) => Promise<void>) {
    if (!this.pool) throw new Error('Database not initialized')

    const connection = await this.pool.getConnection()

    try {
      await connection.beginTransaction()
      await callback(connection)
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  // Initialize database tables
  async initializeTables() {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE,
        password_hash VARCHAR(255),
        subscription_status ENUM('free', 'premium', 'enterprise') DEFAULT 'free',
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,

      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        session_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Projects table
      `CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        project_type ENUM('web', 'mobile', 'api', 'other') DEFAULT 'web',
        files JSON,
        settings JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // AI Usage tracking
      `CREATE TABLE IF NOT EXISTS ai_usage (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        model_used VARCHAR(100),
        tokens_used INT,
        cost_cents INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`,

      // Payments table
      `CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36),
        stripe_payment_id VARCHAR(255),
        amount_cents INT,
        currency VARCHAR(3) DEFAULT 'USD',
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )`
    ]

    for (const tableSQL of tables) {
      await this.query(tableSQL)
    }

    console.log('✅ Database tables initialized')
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.query('SELECT 1')
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  // Close connection pool
  async close() {
    if (this.pool) {
      await this.pool.end()
      console.log('✅ MySQL connection pool closed')
    }
  }
}

// Singleton instance
export const db = new MySQLDatabase()

// Convenience functions
export async function initializeDatabase() {
  await db.initializeTables()
}

export async function closeDatabase() {
  await db.close()
}

// User management functions
export async function createUser(userData: {
  id: string
  email: string
  username?: string
  passwordHash?: string
}) {
  const sql = `
    INSERT INTO users (id, email, username, password_hash)
    VALUES (?, ?, ?, ?)
  `
  await db.query(sql, [
    userData.id,
    userData.email,
    userData.username || null,
    userData.passwordHash || null
  ])
}

export async function getUserByEmail(email: string) {
  const sql = 'SELECT * FROM users WHERE email = ?'
  return db.queryOne(sql, [email])
}

export async function getUserById(id: string) {
  const sql = 'SELECT * FROM users WHERE id = ?'
  return db.queryOne(sql, [id])
}

// Session management
export async function createSession(sessionData: {
  id: string
  userId: string
  data: any
  expiresAt: Date
}) {
  const sql = `
    INSERT INTO sessions (id, user_id, session_data, expires_at)
    VALUES (?, ?, ?, ?)
  `
  await db.query(sql, [
    sessionData.id,
    sessionData.userId,
    JSON.stringify(sessionData.data),
    sessionData.expiresAt
  ])
}

export async function getSessionById(id: string) {
  const sql = 'SELECT * FROM sessions WHERE id = ? AND expires_at > NOW()'
  return db.queryOne(sql, [id])
}

// Project management
export async function createProject(projectData: {
  id: string
  userId: string
  name: string
  description?: string
  type?: string
  files?: any
  settings?: any
}) {
  const sql = `
    INSERT INTO projects (id, user_id, name, description, project_type, files, settings)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  await db.query(sql, [
    projectData.id,
    projectData.userId,
    projectData.name,
    projectData.description || null,
    projectData.type || 'web',
    JSON.stringify(projectData.files || {}),
    JSON.stringify(projectData.settings || {})
  ])
}

export async function getUserProjects(userId: string) {
  const sql = 'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC'
  return db.query(sql, [userId])
}

export async function updateProject(id: string, updates: any) {
  const sql = 'UPDATE projects SET ? WHERE id = ?'
  await db.query(sql, [updates, id])
}

export async function deleteProject(id: string) {
  const sql = 'DELETE FROM projects WHERE id = ?'
  await db.query(sql, [id])
}

// AI Usage tracking
export async function trackAIUsage(usageData: {
  userId: string
  model: string
  tokens: number
  costCents: number
}) {
  const sql = `
    INSERT INTO ai_usage (id, user_id, model_used, tokens_used, cost_cents)
    VALUES (UUID(), ?, ?, ?, ?)
  `
  await db.query(sql, [
    usageData.userId,
    usageData.model,
    usageData.tokens,
    usageData.costCents
  ])
}

export async function getUserAIUsage(userId: string, days: number = 30) {
  const sql = `
    SELECT model_used, SUM(tokens_used) as total_tokens, SUM(cost_cents) as total_cost
    FROM ai_usage
    WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY model_used
  `
  return db.query(sql, [userId, days])
}