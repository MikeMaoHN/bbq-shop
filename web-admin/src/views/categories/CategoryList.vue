<template>
  <div class="category-list">
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <span class="page-title">分类管理</span>
          <el-tag type="info" class="stat-tag">
            共 {{ tableData.length }} 个分类
          </el-tag>
        </div>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>

      <el-table :data="tableData" style="width: 100%" v-loading="loading" :row-class-name="tableRowClassName">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="分类名称" min-width="180">
          <template #default="{ row }">
            <div class="category-name">
              <span class="name-text">{{ row.name }}</span>
              <el-tag v-if="row.product_count > 0" size="small" type="info">
                {{ row.product_count }}个商品
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="icon" label="图标" width="100" align="center">
          <template #default="{ row }">
            <el-icon v-if="row.icon" :size="24" color="#666">
              <Menu />
            </el-icon>
            <span v-else class="no-icon">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.sort < 10 ? 'success' : 'info'" size="small">
              {{ row.sort }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small" effect="plain">
              {{ row.status === 1 ? '已启用' : '已禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right" align="center">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                @click="showEditDialog(row)"
                :icon="Edit"
                circle
              >
              </el-button>
              <el-button 
                :type="row.status === 1 ? 'warning' : 'success'" 
                size="small"
                @click="toggleStatus(row)"
                :icon="row.status === 1 ? 'VideoPause' : 'VideoPlay'"
                circle
              >
              </el-button>
              <el-popconfirm
                title="确定要删除该分类吗？"
                confirm-button-text="确定"
                cancel-button-text="取消"
                icon-color="danger"
                @confirm="deleteCategory(row.id)"
              >
                <template #reference>
                  <el-button 
                    type="danger" 
                    size="small" 
                    :icon="Delete"
                    circle
                  >
                  </el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="editingCategory ? '编辑分类' : '新增分类'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入分类名称" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="分类图标" prop="icon">
          <el-input v-model="form.icon" placeholder="请输入图标路径（可选）" />
          <div class="form-tip">用于前端显示的分类图标 URL</div>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
          <div class="form-tip">数字越小越靠前</div>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Plus, Menu, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import api from '@/api'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const editingCategory = ref(null)
const formRef = ref(null)

const form = reactive({
  name: '',
  icon: '',
  sort: 0,
  status: 1
})

const rules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
}

onMounted(() => {
  loadCategories()
})

const loadCategories = async () => {
  loading.value = true
  try {
    const result = await api.getCategories({ page: 1, limit: 100 })
    tableData.value = Array.isArray(result) ? result : result.list || []
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

const tableRowClassName = ({ row }) => {
  if (row.status === 0) return 'disabled-row'
  return ''
}

const showAddDialog = () => {
  editingCategory.value = null
  Object.assign(form, { name: '', icon: '', sort: 0, status: 1 })
  dialogVisible.value = true
}

const showEditDialog = (row) => {
  editingCategory.value = row
  Object.assign(form, {
    name: row.name,
    icon: row.icon || '',
    sort: row.sort,
    status: row.status
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  try {
    if (editingCategory.value) {
      await api.updateCategory(editingCategory.value.id, form)
      ElMessage.success('更新成功')
    } else {
      await api.createCategory(form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadCategories()
  } catch (error) {
    console.error('保存分类失败:', error)
    ElMessage.error(error.message || '保存失败')
  }
}

const toggleStatus = async (row) => {
  try {
    const action = row.status === 1 ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}该分类吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await api.updateCategory(row.id, { status: row.status === 1 ? 0 : 1 })
    ElMessage.success('操作成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('更新状态失败:', error)
    }
  }
}

const deleteCategory = async (id) => {
  try {
    await api.deleteCategory(id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    console.error('删除分类失败:', error)
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.category-list {
  height: 100%;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-tag {
  font-size: 13px;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.name-text {
  font-weight: 500;
  color: #303133;
}

.no-icon {
  color: #ccc;
  font-size: 18px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.action-buttons .el-button {
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  line-height: 1.5;
}

/* 表格样式优化 */
:deep(.el-table) {
  font-size: 14px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

:deep(.disabled-row) {
  background-color: #fafafa;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>
