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

    <!-- 链接所在列 -->
    <el-form-item style="margin-top: 40px;" :label="$t('labels.dataType')" size="large" required>
      <el-select v-model="dataType" :placeholder="$t('placeholder.dataType')" style="width: 100%">
        <el-option v-for="meta in canChooseDateType" :key="meta.value" :label="meta.label" :value="meta" />
      </el-select>
    </el-form-item>

    <!-- xhsCookie 输入框 -->
    <el-form-item style="margin-top: 20px;" :label="$t('labels.xhsCookie')" size="large" required v-if="dataType.value != 'douyinDetail'">
      <el-input v-model="xhsCookie" type="text" :placeholder="$t('placeholder.xhsCookie')"></el-input>
    </el-form-item>

    <!-- cookie 输入框 -->
    <el-form-item style="margin-top: 20px;" :label="$t('labels.cookie')" size="large" required v-if="dataType.value == 'douyinDetail'">
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
          {{ fieldToMap.name }}
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
import  { completeMappedFields, getCellValueByCell, setRecord, addRecords } from '../utils/tableUtils';
import { config } from '../utils/config';
import {i18n} from '../locales/i18n.js';
import { watch } from 'vue';

// -- 数据区域
const { t } = useI18n();
const lang = i18n.global.locale;

const canChooseDateType = ref(config.dataType)
const dataType = ref(config.dataType[0])
const canChooseField = computed(() => dataType.value.canChooseField)
// 可选择字段展示map
const fieldsToMap = computed(() => canChooseField.value.map(field => ({ label: field, name: config.feilds[field][lang]})));
// 已选择字段
const checkedFieldsToMap = ref(canChooseField.value)   // 默认的to-map的字段
watch(canChooseField, () => {
  checkedFieldsToMap.value = canChooseField.value;
});

const fieldListSeView = ref([])
const linkFieldId = ref('')  // 链接字段Id

const isWritingData = ref(false)
// 是否全选
const checkAllToMap = ref(false)
const isIndeterminateToMap = ref(true)
const cookie = ref('')
const xhsCookie = ref('')

const issubmitAbled = computed(() => {
  return linkFieldId.value && checkedFieldsToMap.value.length && 
      ((dataType.value.value == "douyinDetail" && cookie.value) || (dataType.value.value != "douyinDetail" && xhsCookie.value))
})  // 是否允许提交，及必选字段是否都填写

// 字段在表格对应的列
const mappedFieldIds = ref({})


// -- 核心算法区域
// --001== 写入数据
const writeData = async () => {
  var errorCount = 0;
  isWritingData.value = true

  const selection = await bitable.base.getSelection();

  // 获取字段所在列，匹配已有的字段，创建缺少的字段
  const mappedFields = await completeMappedFields(selection, checkedFieldsToMap.value) 
  mappedFieldIds.value = mappedFields
  
  // 加载bitable实例
  const { tableId, viewId } = selection;
  const table = await bitable.base.getActiveTable();
  const view = await table.getViewById(viewId);

  // ## mode1: 全部记录
  // const recordList = await view.getVisibleRecordIdList()

  // ## model2: 交互式选择记录 
  const recordList = await bitable.ui.selectRecordIdList(tableId, viewId);

  localStorage.setItem('cookie', cookie.value)   // string 类型  
  localStorage.setItem('xhsCookie', xhsCookie.value)   // string 类型

  // 错误处理，链接字段格式错误，应为文本类型
  const linkField = await table.getFieldMetaById(linkFieldId.value)
  if (linkField.type !== FieldType.Text) {
    await bitable.ui.showToast({
      toastType: 'warning',
      message: `[${linkField.name}] ${t('errorTip.errorLinkType')}`
    })
    isWritingData.value = false
  }

  for (var recordId of recordList) {
    try {
      console.log("writeData() >> recordId", recordId)

      var link = await getCellValueByCell(table, recordId, linkFieldId.value)
      if (!link) {
        throw new Error(t('errorTip.emptyNoteLink'));
      }

      console.log("writeData() >> noteLink", link)
      var infoData = await getDateByUrl(link, dataType.value);

      console.log("writeData() >> infoData", infoData)
      if (Array.isArray(infoData)) {
        await addRecords(table, infoData, mappedFields);
      } else {
        await setRecord(table, recordId, infoData, mappedFields);
      }
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
const getDateByUrl = async (link, dataType) => {
  const { url, data } = getQueryParams(link, dataType);
  var requestConfig = {
    method: 'post',
    url: url,
    data : data,
    headers: { 'Content-Type': 'application/json' },
  };
  var res = await axios(requestConfig)
  console.log(res.data);
  if (res.data.code === 0)
    return res.data.data
  else 
    return {code: -1, msg: res.data?.msg ?? '获取数据错误'}
};  

const getQueryParams = (link, dataType) => {
  let data = {}
  if (dataType.value == 'douyinDetail') {
      data = {
        'url': link,
        'dyCookie': {
          "ttwid": cookie.value
        }
      };
  } else {
    let { a1, web_session} = parseCookie(xhsCookie.value)
    data = {
        'url': link,
        "xhsCookies": { a1, web_session}
    }
  }
  return {
    url: `${config.serverHost}${dataType.path}`,
    data: data
  }
}


function parseCookie(cookie) {
    let cookieObj = {};
    let cookieArr = cookie.split('; ');

    for (let i = 0; i < cookieArr.length; i++) {
        let cookiePair = cookieArr[i].split('=');
        cookieObj[decodeURIComponent(cookiePair[0])] = decodeURIComponent(cookiePair[1]);
    }

    console.log(cookieObj);

    return cookieObj;
}


// Map==全选事件
const handlecheckAllToMapChange = (val) => {
  const data = JSON.parse(JSON.stringify(fieldsToMap.value))
  console.log("val", val)
  if (val) {
    checkedFieldsToMap.value = []
    for (const item of data) {
      checkedFieldsToMap.value.push(item.label);
    }
  } else {
    checkedFieldsToMap.value = []
  }
  isIndeterminateToMap.value = false
  console.log('checkedFieldsToMap:', checkedFieldsToMap.value)
}
// Map==字段选择事件
const handleCheckedFieldsToMapChange = (value) => {
  const checkedCount = value.length
  checkAllToMap.value = checkedCount === fieldsToMap.value.length
  isIndeterminateToMap.value = checkedCount > 0 && checkedCount < fieldsToMap.value.length
  console.log('checkedFieldsToMap:', checkedFieldsToMap.value)
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
  if (localStorage.getItem('xhsCookie') !== null) {  // string 类型
    xhsCookie.value = localStorage.getItem('xhsCookie')
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
