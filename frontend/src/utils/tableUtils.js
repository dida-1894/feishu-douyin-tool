import { bitable, FieldType } from "@lark-base-open/js-sdk";
import { config } from './config';
import { i18n } from '../locales/i18n.js';
import { downloadFiles } from "./download";

const lang = i18n.global.locale;
const tokenToCellVaule = {};

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
    const recordFields = await getRecordFields(infoData, mappedFieldIdMap)
    console.log("setRecord ====>", recordFields)

    await table.setRecord(recordId, {
        fields: recordFields
    })
}

export async function addRecords(table, recordList, mappedFieldIdMap) {
    const recordValues = recordList.map(async (record) => {
        const fields = await getRecordFields(record, mappedFieldIdMap);
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
const getRecordFields = async (infoData, mappedFields) => {
    let recordFields = {}
    let feildId = ''
    let fetchDataTimeValue = Date.now()

    for (let field in mappedFields) {
        let value = ''

        let fieldConfig = getFieldConfigByKey(field);
        let key = fieldConfig.key;

        feildId = mappedFields[field]

        if (fieldConfig && fieldConfig.type === FieldType.Attachment) {
            let urlList = typeof infoData[key] === 'string' ? [infoData[key]] : infoData[key];
            if (!urlList) {
                continue;
            }
            urlList = urlList
                .filter(url => url !== undefined && url !== '')  // 过滤掉 undefined 和空字符串
                .map(url => {
                    return config.serverHost + (fieldConfig.media == 'video' ?  "/file/getVideo?url=" : '/file/getImage?url=') + url;
                });
            console.log(urlList);
            if (urlList && urlList.length > 0) {
                value = await getAttachmentCellValue({urlList, filename: "testfilename"});
            }
        } else if (field === 'fetchDataTime') {
            value = fetchDataTimeValue
        } else {
            value = infoData[key]
        }

        if (fieldConfig.type === FieldType.Text && typeof value != 'string') {
            value = JSON.stringify(value)
        }

        if (value && value !== '') {
            recordFields[feildId] = value
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
    let field =  config.feilds[key];
    if (field && field.type) {
        return field.type;
    }
    return FieldType.Text;
}

function getFieldConfigByKey(key) {
    let field =  config.feilds[key];
    if (field && field.type) {
        return field;
    }
    return null;
}

export async function getAttachmentCellValue({ urlList, filename}) {
    return Promise.allSettled(downloadFiles(urlList, filename))
        .then(async (resultList) => {
            if (resultList) {
                const fileList = resultList
                    .filter(fileResult => fileResult.status === 'fulfilled')
                    .map(fulfilledFile => fulfilledFile.value);
                console.log(fileList)
                const idList = await bitable.base.batchUploadFile(fileList).catch((e) => {
                    console.error(e);
                    throw e;
                });
                if (idList && idList.length > 0) {
                    console.log(idList)
                    console.log(tokenToCellVaule)
                    var cellValue = idList.map((fileToken, index) => {
                        var file = fileList[index]
                        return {
                            name: file.name,
                            size: file.size,
                            timeStamp: new Date().getTime(),
                            token: fileToken,
                            type: file.type,
                        }
                    });
                    console.log(cellValue)
                    return cellValue;
                }
            }
        })
        .catch((e) => {
            console.error(e)
        });
}