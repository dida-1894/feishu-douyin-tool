<template>
  <el-form ref="form" class="form" label-position="top">
    <div style="width: 100%;padding-left: 10px;border-left: 5px solid #2598f8;margin-bottom: 20px;padding-top: 5px;">{{ $t('title') }}</div>
    <el-alert style="margin: 20px 0;color: #606266;" :title="$t('alerts.selectNumberField')" type="info" />
    <div class="helper-doc">
      <span>{{ $t('helpTip') }}</span>
      <span style="height: 16px;width: 16px;margin-left: 12px;">
        <a href="https://aigccamp.feishu.cn/wiki/LvQRwI1A4iYtnMkOBtZc2zfsnMd" target="_blank"><span>说明文档</span></a>
      </span>
      
    </div>

    <!-- cookie 输入框 -->
    <el-form-item style="margin-top: 20px;" :label="$t('labels.cookie')" size="large" required>
      <el-input v-model="cookie" type="text" :placeholder="$t('placeholder.cookie')"></el-input>
      
    </el-form-item>
    

    <!-- 链接所在列 -->
    <el-form-item style="margin-top: 40px;" :label="$t('labels.link')" size="large" required>
      <el-select v-model="linkFieldId" :placeholder="$t('placeholder.link')" style="width: 100%">
        <el-option v-for="meta in fieldListSeView" :key="meta.id" :label="meta.name" :value="meta.id" />
      </el-select>
    </el-form-item>
    
    <!-- 字段选择 -->
    <div class="map-fields-checklist">
      <el-checkbox v-model="checkAllToMap" :indeterminate="isIndeterminateToMap" @change="handlecheckAllToMapChange">{{
        $t('selectGroup.selectAll') }}</el-checkbox>
      <el-checkbox-group v-model="checkedFieldsToMap" @change="handleCheckedFieldsToMapChange">
        <el-checkbox v-for="fieldToMap in fieldsToMap" :key="fieldToMap.label" :label="fieldToMap.label">
          {{ $t(`selectGroup.videoInfo.${fieldToMap.label}`) }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
    <el-alert style="display: flex;align-items: flex-start;margin: 20px 0;background-color: #e1eaff;color: #606266;" :title="$t('alerts.selectGroupFieldTip')" type="info" show-icon />
    
    <!-- 提交按钮 -->
    <el-button v-loading="isWritingData" @click="writeData" :disabled="!issubmitAbled" color="#3370ff" type="primary" plain size="large">{{ $t('submit') }}</el-button>
  </el-form>
    
  
</template>

<script setup>
import { bitable, FieldType } from '@lark-base-open/js-sdk';
import { useI18n } from 'vue-i18n';
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';


const douyinFields = [
  'type',
  'title',
  'nickname',
  'releaseTime',
  'collectionCount',
  'likeCount',
  'shareCount',
  'commentCount',
  'videoUrl',
  'videoCover',
  'musicUrl',
  'musicTitle',
  'signature',
  'userhome',
  'videoId',
  'images',
  'msg',
  'fetchDataTime'
];

// -- 数据区域
const { t } = useI18n();
const fieldListSeView = ref([])
const linkFieldId = ref('')  // 链接字段Id

const isWritingData = ref(false)
// 是否全选
const checkAllToMap = ref(false)
const isIndeterminateToMap = ref(true)
// 可选择字段
const canChooseField = ref(douyinFields)
// 可选择字段展示map
const fieldsToMap = computed(() => canChooseField.value.map(field => ({ label: field })));
// 已选择字段
const checkedFieldsToMap = ref(canChooseField.value)   // 默认的to-map的字段
const cookie = ref('')

const issubmitAbled = computed(() => {
  return linkFieldId.value && checkedFieldsToMap.value.length && cookie.value
})  // 是否允许提交，及必选字段是否都填写

// 字段在表格对应的列
const mappedFieldIds = ref({})


// -- 核心算法区域
// --001== 写入数据
const writeData = async () => {
  var errorCount = 0;
  isWritingData.value = true

  // 获取字段所在列，匹配已有的字段，创建缺少的字段
  const mappedFields = await completeMappedFields(checkedFieldsToMap.value) 
  mappedFieldIds.value = mappedFields
  
  // 加载bitable实例
  const { tableId, viewId } = await bitable.base.getSelection();
  const table = await bitable.base.getActiveTable();
  const view = await table.getViewById(viewId);

  // ## mode1: 全部记录
  // const recordList = await view.getVisibleRecordIdList()

  // ## model2: 交互式选择记录 
  const recordList = await bitable.ui.selectRecordIdList(tableId, viewId);

  localStorage.setItem('cookie', cookie.value)   // string 类型

  // 错误处理，链接字段格式错误，应为文本类型
  const linkField = await table.getFieldMetaById(linkFieldId.value)
  if (linkField.type !== FieldType.Text) {
    await bitable.ui.showToast({
      toastType: 'warning',
      message: `[${linkField.name}] ${t('errorTip.errorLinkType')}`
    })
    isWritingData.value = false
  }

  for (let recordId of recordList) {
    try {
      console.log("writeData() >> recordId", recordId)

      let noteLink = await getCellValueByCell(table, recordId, linkFieldId.value)
      if (!noteLink) {
        throw new Error(t('errorTip.emptyNoteLink'));
      }

      console.log("writeData() >> noteLink", noteLink)
      let infoData = await getDateByUrl(noteLink);

      console.log("writeData() >> infoData", infoData)
      await setRecord(table, recordId, infoData, mappedFields);
    } catch (err) {
      console.error(err)
      await bitable.ui.showToast({
        toastType: 'warning',
        message: err.message
      })
      errorCount += 1;
    }
  }

  isWritingData.value = false
  await bitable.ui.showToast({
    toastType: 'success',
    message: `${t('finishTip')} ${errorCount}`
  })

}


/*
* 请求接口获取数据
*/
const getDateByUrl = async (noteLink) => {
  
  var url = `/api`;
  let dyCookie = parseCookies(cookie.value);

  var data = {
    'url': noteLink,
    'dyCookie': dyCookie
  };

  var config = {
    method: 'post',
    url: url,
    data : data,
    headers: { 'Content-Type': 'application/json' },
  };
  let res = await axios(config)
  console.log(res.data);
  if (res.data.code === 0)
    return res.data.data
  else 
    return {code: -1, msg: res.data?.msg ?? '获取数据错误'}
};  

// 依据 recordId & filedId 获取 cell 值
const getCellValueByCell = async (table, recordId, fieldId) => {
  const cellValue = await table.getCellValue(fieldId, recordId)

  if (typeof cellValue == 'object')
    return cellValue[0].text

  return cellValue
}

/**
 * 匹配已有的字段，创建缺少的字段
 */ 
const completeMappedFields = async (checkedFieldsToMap) => {
  const selection = await bitable.base.getSelection()
  const table = await bitable.base.getTableById(selection.tableId)
  const view = await table.getViewById(selection.viewId)
  const fieldMetaList = await view.getFieldMetaList()
  // 匹配已有的字段
  const mappedFields = getSelectedFieldsId(fieldMetaList, checkedFieldsToMap)
  console.log("writeData() >> original mappedFields", mappedFields)

  for (let key in mappedFields) {
    if (mappedFields[key] === -1) {
      let type = getFieldTypeByKey(key);
      mappedFields[key] = await table.addField({
        type: type,
        name: t(`selectGroup.videoInfo.${key}`),
      })
    }
  }

  console.log("writeData() >> created mappedFields", mappedFields)
  return mappedFields;
}

// 获取所勾选字段的字段Id
const getSelectedFieldsId = (fieldList, checkedFields) => {
  const mappedFields = {};
  for (let field of checkedFields) {
    // 查找与checkedFields相匹配的fieldListSeView项目
    const foundField = fieldList.find(f => f.name ===  t(`selectGroup.videoInfo.${field}`));

    const feildType = getFieldTypeByKey(field);
    if (foundField && foundField.type !== feildType) {
      const checkFeild = `checks.${feildType}`
      throw new Error(` [${t(`selectGroup.videoInfo.${field}`)}] ${t(checkFeild)}`)
    }
    
    // 如果找到了相应的项目，就使用其id，否则设置为-1
    mappedFields[field] = foundField ? foundField.id : -1;
  }

  return mappedFields;
} 

/**
 * --009== 获取并设置特定 table 的特定 record 的特定字段集合的 Value
 * @param {object} totalNoteInfo 
 * @param {object} table 数据表
 * @param {string} recordId 记录ID
 * @param {object} mappedFieldIdMap 映射字段Ids 
 */
const setRecord = async (table, recordId, infoData, mappedFieldIdMap) => {
  console.log("setRecord mappedFieldIdMap ====>" , mappedFieldIdMap)
  const recordFields = getRecordFields(infoData, mappedFieldIdMap)
  console.log("setRecord ====>" , recordFields)

  await table.setRecord(recordId, {
    fields: recordFields
  })
}

const addRecord = async (table, infoData, mappedFieldIdMap) => {
  
  const recordFields = getRecordFields(infoData, mappedFieldIdMap)
  console.log(recordFields)


  await table.addRecord({
    fields: recordFields
  })
}


/**
 * 查询式，获取 recordFields
 * @param {object} infoData 数据
 * @param {object} mappedFieldIdMap 字段对应列id
 */
const getRecordFields = (infoData, mappedFields) => {
  let recordFields = {}
  let key = ''
  let value = ''
  let fetchDataTimeValue = Date.now()

  for (let field in mappedFields) {

    key = mappedFields[field]

    if (field === 'fetchDataTime')
      value = fetchDataTimeValue
    else
      value = infoData[field]

    if (value) {
      recordFields[key] = value
    }
  }
  return recordFields
}


// Map==全选事件
const handlecheckAllToMapChange = (val) => {
  const data = JSON.parse(JSON.stringify(fieldsToMap.value))
  console.log("val", val)
  if (val) {
    checkedFieldsToMap.value = []
    for (const item of data)
      checkedFieldsToMap.value.push(item.label);


  } else {
    checkedFieldsToMap.value = []
  }
  isIndeterminateToMap.value = false
}
// Map==字段选择事件
const handleCheckedFieldsToMapChange = (value) => {
  const checkedCount = value.length
  checkAllToMap.value = checkedCount === fieldsToMap.value.length
  isIndeterminateToMap.value = checkedCount > 0 && checkedCount < fieldsToMap.value.length
  console.log('checkedFieldsToMap:', checkedFieldsToMap.value)

}


const parseCookies = (ttwidCookie) => {
  return {
        "ttwid": ttwidCookie
  };
}

function getFieldTypeByKey(key) {
    switch (key) {
        case "type":  // 类型
        case "title":  // 视频名称
        case "uploader": // 作者名
        case "videoUrl":
        case "videoCover":
        case "musicUrl":
        case "musicTitle":
        case "signature":
        case "userhome":
        case "videoId":
        case "images":
            return FieldType.Text;
        case "releaseTime":
        case "lastUpdateTime":
        case "fetchDataTime":
            return FieldType.DateTime;
        case "danmuCount":
        case "coinCount":
        case "viewCount":
        case "collectionCount":
        case "likeCount":
        case "commentCount":  // 评论量
        case "totalInterCount":  // 总互动量
        case "shareCount":
            return FieldType.Number;
        case "commentWc":
        case "danmuWc":
            return FieldType.Attachment;
        default:
            return FieldType.Text;
    }
}

onMounted(async () => {

  // 获取字段列表 -- start
  const selection = await bitable.base.getSelection()
  const table = await bitable.base.getTableById(selection.tableId)
  const view = await table.getViewById(selection.viewId)
  fieldListSeView.value = await view.getFieldMetaList()
  console.log("onMounted >> 多维表格字段", fieldListSeView.value)
  console.log("onMounted >> 已选中的采集数据字段", checkedFieldsToMap.value)

  if (localStorage.getItem('cookie') !== null) {  // string 类型
    cookie.value = localStorage.getItem('cookie')
  }
});
    
</script>



<style scoped>
.helper-doc {
  
  margin-top: -10px;
  font-size: 14px;
}
.helper-doc a {
  color: #409eff;
}
.helper-doc a:hover {
  color: #7abcff;
}
</style>
