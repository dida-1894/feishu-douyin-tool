import { bitable, FieldType } from '@lark-base-open/js-sdk';
import { downloadFile2, downloadFiles } from "./download";


const successSet = new Set();

const uploadSeccessSet = new Set();

export async function uploadFiles({ urlList, filename, fieldId, recordId, table }) {
    return Promise.allSettled(downloadFiles(urlList, filename))
        .then(async (resultList) => {
            if (resultList) {
                const fileList = resultList
                .filter(fileResult => fileResult.status === 'fulfilled')
                .map(fulfilledFile => fulfilledFile.value);
                console.log(fulfilledValues)

                const idList = await bitable.base.batchUploadFile(fileList).catch((e) => {
                    console.error(e);
                    throw e;
                });

                // return setFile({ file, fieldId, recordId, table, url });
            }
        })
        .catch((e) => {
            console.error(e)
        });
}



export async function up({ url, filename, fieldId, recordId, table }) {
    return downloadFile2({ url, filename })
        .then((file) => {
            if (file) {
                return setFile({ file, fieldId, recordId, table, url });
            }
        })
        .catch((e) => {
            console.error(e)
        });
}

const uploadStatus = {};

const recordValueCache = {};

const urlUploadId = {};

function clearCache() {
    for (const key in urlUploadId) {
        delete urlUploadId[key];
    }
    for (const key in recordValueCache) {
        delete recordValueCache[key];
    }

    for (const key in uploadStatus) {
        delete uploadStatus[key];
    }
    successSet.clear();
}

async function setFile({ file, fieldId, recordId, table, url }) {
    const cacheKey = `${table.id}_${recordId}_${fieldId}`;

    for (const iterator of Object.values(uploadStatus)) {
        const { url: hisUrl } = iterator;
        if (url === hisUrl) {
            recordValueCache[cacheKey].uploadStatus.push(iterator);
            return checkFileDownloadAndSetCellValue({ url, fieldId, table });
        }
    }

    const id = await bitable.base.uploadFile(file).catch((e) => {
        console.error(e);
        throw e;
    });
    console.log("upload file success", id);

    urlUploadId[url] = {}
    urlUploadId[url].uploadId = id;
    urlUploadId[url].fileName = file.name;
    if (!urlUploadId[url]) {
        urlUploadId[url] = {
          tableRecord: new Set([cacheKey]),
        };
    } else {
        urlUploadId[url].tableRecord.add(cacheKey);
    }

    if (!uploadStatus[id]) {
        uploadStatus[id] = {
            success: false,
            fileName: file.name,
            fieldId,
            table,
            id,
            url,
            singleCellValue: undefined,
            settled: false,
        };
        if (!recordValueCache[tableIdRecordId]) {
            recordValueCache[tableIdRecordId] = {
              shouldLoadFile: 1,
              uploadStatus: [],
            };
        } else {
            recordValueCache[tableIdRecordId].shouldLoadFile += 1;
        }
        recordValueCache[cacheKey].uploadStatus.push(uploadStatus[id]);
    }
    return new Promise((resolve, rej) => {
        console.log("ifFileUploadAndSetSuccess Promise")
        ifFileUploadAndSetSuccess({ id, fileName: file.name, resolve });
    });
}
let off = () => {};

function ifFileUploadAndSetSuccess({ id, fileName, resolve }) {
    console.log("ifFileUploadAndSetSuccess")
    off();
    off = bitable.base.onUploadStatusChange(getUploadStatusChange({ id, fileName, resolve }));
}

function getUploadStatusChange({ id: currentUploadId, fileName: currentFileName, resolve }) {
    return async function uploadStatusChange(e) {
        console.log("uploadStatusChange", e);
        const uploadFileId = e.data.id;

        const data = e.data;
        if (data) {
            const uploadFileInfo = data.tasks.list[0];
            const token = uploadFileInfo.token;
            const statusFileName = uploadFileInfo.name;
            if (token) {
                uploadSeccessSet.add(uploadFileInfo);
                if (!uploadStatus[uploadFileId]) {
                    return;
                }
                const { table, fieldId, settled, fileName } = uploadStatus[uploadFileId];
                if (settled) {
                    return;
                }
                if (fileName !== statusFileName) {
                    return;
                }
                if (!(uploadFileId === currentUploadId && fileName === currentFileName)) {
                    return;
                }
                uploadStatus[uploadFileId].settled = true;
                const cellValue = {
                    name: uploadFileInfo.name,
                    size: uploadFileInfo.size,
                    timeStamp: new Date().getTime(),
                    token: uploadFileInfo.token,
                    type: uploadFileInfo.file.type,
                };

                uploadStatus[uploadFileId].singleCellValue = cellValue;
                uploadStatus[uploadFileId].success = true;
                const url = uploadStatus[uploadFileId].url;
                checkFileDownloadAndSetCellValue({ url, table, fieldId }).finally(() => {
                    resolve(true);
                });
            }
        }
    };
}

async function checkFileDownloadAndSetCellValue({ url, table, fieldId }) {
    const setCellTask = [];
    urlUploadId[url].tableRecord.forEach((tableRecordId) => {
        const recordId = tableRecordId.split("_")[1];
        debugger
        if (!recordValueCache[tableRecordId]) {
            return;
        }
        const cellFilestatus = recordValueCache[tableRecordId].uploadStatus;
        if (cellFilestatus.length >= recordValueCache[tableRecordId].shouldLoadFile) {
            if (cellFilestatus.every((s) => s.success)) {
                const allFiles = cellFilestatus.map((v) => v.singleCellValue);
                setCellTask.push(
                    table.getCellValue(fieldId, recordId).then((c) => {
                        let shouldSetCellValue = allFiles;
                        return table
                            .setCellValue(fieldId, recordId, shouldSetCellValue)
                            .then((r) => {
                                console.log("setCellValue success", r);
                                if (r) {
                                    cellFilestatus.forEach((cell) => {
                                        successSet.add(cell.url);
                                    });
                                    delete recordValueCache[tableRecordId];
                                    urlUploadId[url].tableRecord.delete(tableRecordId);
                                }
                            })
                            .catch((e) => {
                                console.error("设置失败", e);
                                table
                                    .setCellValue(fieldId, recordId, shouldSetCellValue)
                                    .then((r) => {
                                        if (r) {
                                            cellFilestatus.forEach((cell) => {
                                                successSet.add(cell.url);
                                            });
                                            delete recordValueCache[tableRecordId];
                                            urlUploadId[url].tableRecord.delete(tableRecordId);
                                        }
                                    })
                                    .catch((e) => {
                                        console.error("重试失败", e);
                                    });
                            });
                    })
                );
            } else {
            }
        } else {
        }
    });
    await Promise.allSettled(setCellTask);
    return;
}