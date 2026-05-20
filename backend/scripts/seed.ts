// 数据库初始化脚本
import { initDatabase, runQuery, getOne, getAll, saveDatabase } from '../app/lib/database'
import { hashPassword } from '../app/lib/utils/auth'

async function seed() {
  console.log('🌱 开始初始化数据...')
  
  await initDatabase()
  
  // 创建默认角色
  const roles = [
    { roleName: '管理员', roleCode: 'admin', description: '系统管理员' },
    { roleName: '开发者', roleCode: 'developer', description: '开发人员' },
    { roleName: '运维', roleCode: 'operator', description: '运维人员' },
    { roleName: '只读', roleCode: 'viewer', description: '只读用户' },
  ]
  
  for (const role of roles) {
    runQuery(`
      INSERT OR IGNORE INTO roles (role_name, role_code, description)
      VALUES (?, ?, ?)
    `, [role.roleName, role.roleCode, role.description])
  }
  
  // 创建默认权限
  const permissions = [
    { permName: '用户管理', permCode: 'user:manage', permType: 'menu', resourcePath: '/users' },
    { permName: '角色管理', permCode: 'role:manage', permType: 'menu', resourcePath: '/roles' },
    { permName: '应用管理', permCode: 'app:manage', permType: 'menu', resourcePath: '/apps' },
    { permName: '部署任务', permCode: 'deploy:manage', permType: 'menu', resourcePath: '/deploys' },
    { permName: '脚本管理', permCode: 'script:manage', permType: 'menu', resourcePath: '/scripts' },
    { permName: '配置管理', permCode: 'config:manage', permType: 'menu', resourcePath: '/configs' },
    { permName: '监控管理', permCode: 'monitor:manage', permType: 'menu', resourcePath: '/monitors' },
    { permName: '日志管理', permCode: 'log:manage', permType: 'menu', resourcePath: '/logs' },
    { permName: '故障管理', permCode: 'fault:manage', permType: 'menu', resourcePath: '/faults' },
    { permName: '镜像管理', permCode: 'image:manage', permType: 'menu', resourcePath: '/images' },
    { permName: '备份管理', permCode: 'backup:manage', permType: 'menu', resourcePath: '/backups' },
    { permName: '巡检管理', permCode: 'check:manage', permType: 'menu', resourcePath: '/checks' },
  ]
  
  for (const perm of permissions) {
    runQuery(`
      INSERT OR IGNORE INTO permissions (perm_name, perm_code, perm_type, resource_path)
      VALUES (?, ?, ?, ?)
    `, [perm.permName, perm.permCode, perm.permType, perm.resourcePath])
  }
  
  // 给管理员角色分配所有权限
  const adminRole = getOne('SELECT id FROM roles WHERE role_code = ?', ['admin'])
  if (adminRole) {
    const allPerms = getAll('SELECT id FROM permissions', [])
    for (const perm of allPerms) {
      runQuery(`
        INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)
      `, [adminRole.id, perm.id])
    }
  }
  
  // 创建默认管理员用户
  const adminPasswordHash = await hashPassword('admin123')
  runQuery(`
    INSERT OR IGNORE INTO users (username, password_hash, email, real_name, status)
    VALUES (?, ?, ?, ?, ?)
  `, ['admin', adminPasswordHash, 'admin@insight.dev', '系统管理员', 1])
  
  // 给管理员分配角色
  const adminUser = getOne('SELECT id FROM users WHERE username = ?', ['admin'])
  if (adminUser && adminRole) {
    runQuery(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)
    `, [adminUser.id, adminRole.id])
  }
  
  // 创建示例应用
  runQuery(`
    INSERT OR IGNORE INTO apps (app_name, app_code, app_type, repo_url, description, owner_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, ['示例应用', 'sample-app', 'docker', 'https://github.com/example/sample-app', '这是一个示例应用', adminUser?.id])
  
  // 保存数据库
  saveDatabase()
  
  console.log('✅ 数据初始化完成')
  console.log('📋 默认账号: admin / admin123')
  
  process.exit(0)
}

seed().catch(console.error)