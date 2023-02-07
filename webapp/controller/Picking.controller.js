sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    'sap/ui/model/Sorter',
    "sap/ui/Device",
    "sap/ui/table/library",
    "sap/m/TablePersoController",
    'sap/m/MessageToast',
	'sap/m/SearchField'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, TablePersoController, MessageToast, SearchField) {
        "use strict";

        var _this;
        var _oCaption = {};
        var _aPickDtl = [];

        return BaseController.extend("zuiodfty.controller.Reservation", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();
                this._router.getRoute("RoutePicking").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvNo: oEvent.getParameter("arguments").dlvNo,
                    mvtType: oEvent.getParameter("arguments").mvtType,
                    plantCd: "",
                    matNo: "",
                    batch: "",
                    sloc: "",
                    dlvItem: ""
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYPICKHDRMOD",
                    tblSrc: "ZDV_ODF_PCK_HDR",
                    tblId: "pickHdrTab",
                    tblModel: "pickHdr"
                });

                aTableList.push({
                    modCode: "ODFTYPICKDTLMOD",
                    tblSrc: "ZDV_ODF_PCK_DTL",
                    tblId: "pickDtlTab",
                    tblModel: "pickDtl"
                });

                _this.getColumns(aTableList);

                this._tableRendered = "";
                var oTableEventDelegate = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    },

                    onAfterRendering: function(oEvent) {
                        _this.onAfterTableRendering(oEvent);
                    }
                };

                this.byId("pickHdrTab").addEventDelegate(oTableEventDelegate);
                this.byId("pickDtlTab").addEventDelegate(oTableEventDelegate);
                
                _this.getView().setModel(new JSONModel({
                    results: []
                }), "pickHdr");

                _this.getView().setModel(new JSONModel({
                    results: []
                }), "pickDtl");

                _this.getPickHdr();

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
            },

            getPickHdr() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";
                
                oModel.read("/PickHeaderSet", {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("PickHeaderSet read", data);

                        data.results.forEach((item, idx) => {
                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        });

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "pickHdr");

                        _this.setRowReadMode("pickHdr");

                        var oTable = _this.byId("pickHdrTab");
                        if (oTable.getBinding("rows").aIndices.length > 0) {
                            var aIndices = oTable.getBinding("rows").aIndices;
                            var oData = _this.getView().getModel("pickHdr").getData().results[aIndices[0]];
                            _this.getView().getModel("ui").setProperty("/plantCd", oData.ISSPLANT);
                            _this.getView().getModel("ui").setProperty("/matNo", oData.ISSMATNO);
                            _this.getView().getModel("ui").setProperty("/batch", oData.ISSBATCH);
                            _this.getView().getModel("ui").setProperty("/sloc", oData.ISSSLOC);
                            _this.getView().getModel("ui").setProperty("/dlvItem", oData.DLVITEM);

                            //oTable.setSelectedIndex(aIndices[0]);
                            _this.getPickDtl();
                        } else {
                            _this.getView().getModel("pickDtl").setProperty("/results", []);
                        }

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAutoPickHdr() {
                var oTable = this.byId("pickHdrTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                if (_this.getView().getModel("pickDtl").getData().results.length == 0) {
                    MessageBox.information(_oCaption.INFO_NO_ITEM_TO_PICK);
                    return;
                }

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                var oDataUI = _this.getView().getModel("ui").getData();
                var oDataHdr = _this.getView().getModel("pickHdr").getData().results[aOrigSelIdx[0]];
                // var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => x.ISSPLANT == oDataUI.plantCd &&
                //     x.ISSMATNO == oDataUI.matNo && x.ISSBATCH == oDataUI.batch && x.ISSSLOC == oDataUI.sloc)[0];
                var iBalHdr = parseFloat(oDataHdr.BALANCE);

                _this.getView().getModel("pickDtl").getData().results.forEach((item, idx) => {
                    if (iBalHdr > 0) {
                        var iQty = (parseFloat(item.QTY) > iBalHdr ? (parseFloat(item.QTY) - iBalHdr) : 0);
                        var iToQty = parseFloat(item.QTY) - iQty;
                        var iBalDtl = parseFloat(item.QTY) - iToQty;

                        _this.getView().getModel("pickDtl").setProperty("/results/" + idx.toString() + "/TOQTY", iToQty.toString());
                        _this.getView().getModel("pickDtl").setProperty("/results/" + idx.toString() + "/BALANCE", iBalDtl).toString();

                        iBalHdr -= iToQty;
                    }
                })

                _this.setPickDtl();
            },

            onAddPickHdr() {
                if (_aPickDtl.length > 0) {
                    _this.showLoadingDialog("Loading...");

                    var oModel = this.getOwnerComponent().getModel();

                    _aPickDtl.forEach((item, idx) => {
                        var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => 
                                x.ISSPLANT == item.plantCd && x.ISSMATNO == item.matNo && 
                                x.ISSBATCH == item.batch && x.ISSSLOC == item.sloc
                            )[0];

                        var oDataDtl = _this.getView().getModel("pickDtl").getData().results.filter(x => 
                            x.HUID == item.huId && x.HUITEM == item.huItem
                        )[0];

                        var param = {
                            DLVNO: oDataHdr.DLVNO,
                            DLVITEM: oDataHdr.DLVITEM,
                            SEQNO: "",
                            PLANTCD: oDataHdr.ISSPLANT,
                            SLOC: oDataHdr.ISSSLOC,
                            MATNO: oDataHdr.ISSMATNO,
                            BATCH: oDataHdr.ISSBATCH,
                            PKGNO: oDataDtl.PKGNO,
                            HUID: oDataDtl.HUID,
                            HUITEM: oDataDtl.HUITEM,
                            DLVQTYORD: item.toQty,
                            ACTQTYORD: item.toQty,
                            DLVQTYBSE: item.toQty,
                            ACTQTYBSE: item.toQty,
                            BASEUOM: oDataDtl.UOM,
                            PKGGRSWT: oDataDtl.GROSSWT,
                            PKGNETWT: oDataDtl.NETWT,
                            WTUOM: oDataDtl.WEIGHTUOM,
                            LNDIM: oDataDtl.LENGTH,
                            WDDIM: oDataDtl.WIDTH,
                            DIMUOM: oDataDtl.DIMUOM,
                            BINCD: oDataDtl.BIN
                        }
                        
                        console.log("InfoHUTblSet param", param);
                        oModel.create("/InfoHUTblSet", param, {
                            method: "POST",
                            success: function(data, oResponse) {
                                console.log("InfoHUTblSet create", data);
        
                                if (idx == _aPickDtl.length - 1) {
                                    _this.closeLoadingDialog();
                                    _this.onNavBack();
                                }
                            },
                            error: function(err) {
                                console.log("error", err)
                                _this.closeLoadingDialog();
                            }
                        });

                    })
                } else {
                    MessageBox.information(_oCaption.WARN_NO_DATA_MODIFIED);
                }
            },

            onRefreshPickHdr() {
                _aPickDtl = [];
                _this.getPickHdr();
            },

            onCancelPickHdr() {
                MessageBox.confirm(_oCaption.CONFIRM_PROCEED_CLOSE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.onNavBack();
                        }
                    }
                });
            },

            getPickDtl() {

                var oModel = this.getOwnerComponent().getModel();
                var oDataUI = _this.getView().getModel("ui").getData();
                var sFilter = "PLANTCD eq '" + oDataUI.plantCd + "' and MATNO eq '" + oDataUI.matNo + 
                    "' and BATCH eq '" + oDataUI.batch + "' and SLOC eq '" + oDataUI.sloc + "'";
                
                oModel.read("/PickDetailSet", {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("PickDetailSet read", data);

                        var bIsPickDtlExists = false;
                        data.results.forEach((item, idx) => {
                            var iIdx = _aPickDtl.findIndex(x => x.huId == item.HUID && x.huItem == item.HUITEM);
                            if (iIdx > -1) {
                                bIsPickDtlExists = true;
                                item.TOQTY = parseFloat(_aPickDtl[iIdx].toQty).toString();
                            }

                            item.BALANCE = (parseFloat(item.QTY) - parseFloat(item.TOQTY)).toString();
                        });

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "pickDtl");
                        _this.setRowReadMode("pickDtl");

                        // Set Pick Header
                        if (bIsPickDtlExists) _this.setPickHdr();

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAutoPickDtl() {
                var oTable = this.byId("pickDtlTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                var oDataUI = _this.getView().getModel("ui").getData();
                var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => 
                    x.DLVNO == oDataUI.dlvNo && x.DLVITEM == oDataUI.dlvItem)[0];
                var iBalHdr = parseFloat(oDataHdr.BALANCE);
                var oDataDtl = _this.getView().getModel("pickDtl").getData().results[aOrigSelIdx[0]];
                
                var iQty = (parseFloat(oDataDtl.QTY) > iBalHdr ? (parseFloat(oDataDtl.QTY) - iBalHdr) : 0);
                var iToQty = parseFloat(oDataDtl.QTY) - iQty;
                var iBalDtl = parseFloat(oDataDtl.QTY) - iToQty;
                
                _this.getView().getModel("pickDtl").setProperty("/results/" + (aOrigSelIdx[0]).toString() + "/TOQTY", iToQty.toString());
                _this.getView().getModel("pickDtl").setProperty("/results/" + (aOrigSelIdx[0]).toString() + "/BALANCE", iBalDtl.toString());
                
                _this.setPickDtl();
            },

            onEditPickDtl() {
                var aRows = this.getView().getModel("pickDtl").getData().results;

                if (aRows.length > 0) {
                    _this.byId("btnAutoPickDtl").setVisible(false);
                    _this.byId("btnEditPickDtl").setVisible(false);
                    _this.byId("btnRefreshPickDtl").setVisible(false);
                    _this.byId("btnSavePickDtl").setVisible(true);
                    _this.byId("btnCancelPickDtl").setVisible(true);
    
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("pickDtl").getData());
                    _this.setRowEditMode("pickDtl");
                } else {
                    MessageBox.warning(_oCaption.INFO_NO_DATA_EDIT);
                }
            },

            onRefreshPickDtl() {
                _this.getPickDtl();
            },

            onSavePickDtl() {
                var oTable = this.byId("pickDtlTab");
                var aEditedRows = this.getView().getModel("pickDtl").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    // Validation UOM
                    var sErrType = "";
                    var sUom = "";
                    var iUomDecimal = 0;

                    aEditedRows.forEach((item, idx) => {
                        var aNum = parseFloat(item.TOQTY).toString().split(".");

                        if (item.UOMDECIMAL == 0) {
                            if (!Number.isInteger(parseFloat(item.TOQTY))) sErrType = "UOMDECIMAL";
                        } else if (item.UOMDECIMAL > 0) {
                            if (aNum.length == 1) sErrType = "UOMDECIMAL";
                            else if (aNum[1].length != item.UOMDECIMAL) sErrType = "UOMDECIMAL";
                        }
                        
                        if (parseFloat(item.TOQTY) > parseFloat(item.QTY)) {
                            sErrType = "OVERQTY";
                        }

                        if (sErrType) {
                            sUom = item.UOM;
                            iUomDecimal = item.UOMDECIMAL;
                        }
                    });

                    if (sErrType) {
                        var sErrMsg = "";
                        
                        if (sErrType == "UOMDECIMAL") {
                            sErrMsg = "UOM " + sUom + " should only have " + iUomDecimal.toString() + " decimal place(s).";
                        } else if (sErrType == "OVERQTY") {
                            sErrMsg = "TO Quantity is greater than Quantity.";
                        }

                        MessageBox.warning(sErrMsg);
                        return;
                    }

                    aEditedRows.forEach((item, idx) => {
                        var iIdx = _this.getView().getModel("pickDtl").getData().results.filter(x => 
                                x.HUID == item.HUID && x.HUITEM == item.HUITEM
                            );
                        
                        _this.getView().getModel("pickDtl").setProperty("/results/" + iIdx.toString() + "/TOQTY", item.TOQTY);
                        
                    })

                    _this.setPickDtl();
                    _this.getPickDtl();

                    _this.byId("btnAutoPickDtl").setVisible(true);
                    _this.byId("btnEditPickDtl").setVisible(true);
                    _this.byId("btnRefreshPickDtl").setVisible(true);
                    _this.byId("btnSavePickDtl").setVisible(false);
                    _this.byId("btnCancelPickDtl").setVisible(false);
                } else {
                    MessageBox.information(_oCaption.WARN_NO_DATA_MODIFIED);
                }
            },

            onCancelPickDtl() {
                var aEditedRows = this.getView().getModel("pickDtl").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {

                                _this.byId("btnAutoPickDtl").setVisible(true);
                                _this.byId("btnEditPickDtl").setVisible(true);
                                _this.byId("btnRefreshPickDtl").setVisible(true);
                                _this.byId("btnSavePickDtl").setVisible(false);
                                _this.byId("btnCancelPickDtl").setVisible(false);

                                _this.onRefreshPickDtl();
                            }
                        }
                    });
                } else {
                    _this.byId("btnAutoPickDtl").setVisible(true);
                    _this.byId("btnEditPickDtl").setVisible(true);
                    _this.byId("btnRefreshPickDtl").setVisible(true);
                    _this.byId("btnSavePickDtl").setVisible(false);
                    _this.byId("btnCancelPickDtl").setVisible(false);

                    _this.onRefreshPickDtl();
                }
            },

            setPickDtl() {
                // Save Pick Detail
                _this.getView().getModel("pickDtl").getData().results.forEach(item => {
                    if (parseFloat(item.TOQTY) > 0) {
                        var iIdx = _aPickDtl.findIndex(x => x.huId == item.HUID && x.huItem == item.HUITEM);

                        if (iIdx == -1) {
                            _aPickDtl.push({
                                huId: item.HUID,
                                huItem: item.HUITEM,
                                plantCd: item.PLANTCD,
                                matNo: item.MATNO,
                                batch: item.BATCH,
                                sloc: item.SLOC,
                                toQty: item.TOQTY
                            })
                        } else {
                            _aPickDtl[iIdx].toQty = item.TOQTY
                        }
                    }
                });

                // Set Pick Header
                _this.setPickHdr();
            },

            setPickHdr() {
                var oDataUI = _this.getView().getModel("ui").getData();
                var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => 
                    x.DLVNO == oDataUI.dlvNo && x.DLVITEM == oDataUI.dlvItem)[0];
                var iIdxHdr = _this.getView().getModel("pickHdr").getData().results.findIndex(x => 
                    x.DLVNO == oDataUI.dlvNo && x.DLVITEM == oDataUI.dlvItem);

                var aDataDtl = _aPickDtl.filter(x => x.plantCd == oDataHdr.ISSPLANT && 
                    x.matNo == oDataHdr.ISSMATNO && x.batch == oDataHdr.ISSBATCH && x.sloc == oDataHdr.ISSSLOC);

                var iTotalToQty = 0.0;
                aDataDtl.forEach(item => {
                    iTotalToQty += parseFloat(item.toQty);
                });

                // Set Header
                _this.getView().getModel("pickHdr").setProperty("/results/" + iIdxHdr.toString() + "/PICKQTY", iTotalToQty.toString());
                var iBalHdr = parseFloat(oDataHdr.REQQTY) - parseFloat(oDataHdr.ISSQTY) - iTotalToQty;
                _this.getView().getModel("pickHdr").setProperty("/results/" + iIdxHdr.toString() + "/BALANCE", iBalHdr.toString());
            },

            onCellClickPickHdr(oEvent) {
                var oData = oEvent.getParameters().rowBindingContext.getObject();
                var sPlantCd = oData.ISSPLANT;
                var sMatNo = oData.ISSMATNO;
                var sBatch = oData.ISSBATCH;
                var sSloc = oData.ISSSLOC;
                var sDlvItem = oData.DLVITEM;

                this.onCellClick(oEvent);

                _this.getView().getModel("ui").setProperty("/plantCd", sPlantCd);
                _this.getView().getModel("ui").setProperty("/matNo", sMatNo);
                _this.getView().getModel("ui").setProperty("/batch", sBatch);
                _this.getView().getModel("ui").setProperty("/sloc", sSloc);
                _this.getView().getModel("ui").setProperty("/dlvItem", sDlvItem);

                _this.getPickDtl();
            },

            onNavBack() {
                _this._router.navTo("RouteDeliveryInfo", {
                    sbu: _this.getView().getModel("ui").getData().sbu,
                    dlvNo: _this.getView().getModel("ui").getData().dlvNo
                }, true);
            },

            onInputLiveChange(oEvent) {},

            onNumberLiveChange(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var dValue = oEvent.getParameters().value;

                _this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            },

            onKeyUp(oEvent) {
                if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    var sModel = "";
                    if (oTable.getId().indexOf("pickHdrTab") >= 0) sModel = "pickHdr";
                    else if (oTable.getId().indexOf("pickDtlTab") >= 0) sModel = "pickDtl";

                    if (sModel == "pickHdr") {
                        var sRowId = this.byId(oEvent.srcControl.sId);
                        var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["pickHdr"].sPath;
                        var oRow = this.getView().getModel("pickHdr").getProperty(sRowPath);
                        var sPlantCd = oRow.ISSPLANT;
                        var sMatNo = oRow.ISSMATNO;
                        var sBatch = oRow.ISSBATCH;
                        var sSloc = oRow.ISSSLOC;
                        var sDlvItem = oRow.DLVITEM;

                        _this.getView().getModel("ui").setProperty("/plantCd", sPlantCd);
                        _this.getView().getModel("ui").setProperty("/matNo", sMatNo);
                        _this.getView().getModel("ui").setProperty("/batch", sBatch);
                        _this.getView().getModel("ui").setProperty("/sloc", sSloc);
                        _this.getView().getModel("ui").setProperty("/dlvItem", sDlvItem);

                        _this.getPickDtl();
                    }

                    if (this.byId(oEvent.srcControl.sId).getBindingContext(sModel)) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext(sModel).sPath;

                        oTable.getModel(sModel).getData().results.forEach(row => row.ACTIVE = "");
                        oTable.getModel(sModel).setProperty(sRowPath + "/ACTIVE", "X");

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext(sModel) && row.getBindingContext(sModel).sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
                    }
                }
            },

            getCaption() {
                var oJSONModel = new JSONModel();
                var oCaptionParam = [];
                var oCaptionResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                // Button
                oCaptionParam.push({CODE: "ADD"});
                oCaptionParam.push({CODE: "EDIT"});
                oCaptionParam.push({CODE: "REFRESH"});
                oCaptionParam.push({CODE: "SAVE"});
                oCaptionParam.push({CODE: "CANCEL"});
                oCaptionParam.push({CODE: "AUTOPICK"});

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                oCaptionParam.push({CODE: "INFO_NO_DATA_EDIT"});
                oCaptionParam.push({CODE: "CONFIRM_DISREGARD_CHANGE"});
                oCaptionParam.push({CODE: "WARN_NO_DATA_MODIFIED"});
                oCaptionParam.push({CODE: "INFO_NO_ITEM_TO_PICK"});
                
                oModel.create("/CaptionMsgSet", { CaptionMsgItems: oCaptionParam  }, {
                    method: "POST",
                    success: function(oData, oResponse) {
                        oData.CaptionMsgItems.results.forEach(item => {
                            oCaptionResult[item.CODE] = item.TEXT;
                        })

                        oJSONModel.setData(oCaptionResult);
                        _this.getView().setModel(oJSONModel, "caption");

                        _oCaption = _this.getView().getModel("caption").getData();
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });
            }
        });
    });