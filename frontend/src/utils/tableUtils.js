import { bitable, FieldType } from "@lark-base-open/js-sdk";
import { config } from './config';
import {i18n} from '../locales/i18n.js';

const lang = i18n.global.locale;

// 获取所勾选字段的字段Id
const getSelectedFieldsId = (fieldMetaList, checkedFields) => {
    const mappedFields = {};
    for (let field of checkedFields) {
        // 查找与checkedFields相匹配的fieldListSeView项目
        const foundField = fieldMetaList.find(f => f.name === config.feilds[field][lang]);

        const feildType = getFieldTypeByKey(field);
        if (foundField && foundField.type !== feildType) {
            throw new Error(config.feilds[field][lang] + ' type is not right')
        }

        // 如果找到了相应的项目，就使用其id，否则设置为-1
        mappedFields[field] = foundField ? foundField.id : -1;
    }

    return mappedFields;
}

/**
 * 匹配已有的字段，创建缺少的字段
 */
export async function completeMappedFields(selection, checkedFieldsToMap) {
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
                name: config.feilds[key][lang],
            })
        }
    }

    console.log("writeData() >> created mappedFields", mappedFields)
    return mappedFields;
}



/** 
 * @param {object} table 数据表
 * @param {string} recordId 记录ID
 * @param {string} infoData 记录内容
 * @param {object} mappedFieldIdMap 映射字段Ids 
 */
export async function setRecord(table, recordId, infoData, mappedFieldIdMap) {
    console.log("setRecord mappedFieldIdMap ====>", mappedFieldIdMap)
    const recordFields = getRecordFields(infoData, mappedFieldIdMap)
    console.log("setRecord ====>", recordFields)

    await table.setRecord(recordId, {
        fields: recordFields
    })
}

export async function addRecords(table, recordList, mappedFieldIdMap) {
    const recordValues = recordList.map(record => {
        const fields = getRecordFields(record, mappedFieldIdMap);
        // 返回符合 IRecordValue 类型的对象
        return { fields };
    });

    // 打印转换后的记录列表
    console.log(recordValues);

    // 调用 addRecords 函数保存记录
    await table.addRecords(recordValues);
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

// 依据 recordId & filedId 获取 cell 值
export async function getCellValueByCell(table, recordId, fieldId) {
    const cellValue = await table.getCellValue(fieldId, recordId)
  
    if (typeof cellValue == 'object')
      return cellValue[0].text
  
    return cellValue
}

export function getFieldTypeByKey(key) {
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

