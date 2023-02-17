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
        var _startUpInfo;

        return BaseController.extend("zuiodfty.controller.DeliveryInfo", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();
                this._router.getRoute("RouteDeliveryInfo").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvNo: oEvent.getParameter("arguments").dlvNo,
                    editModeHdr: false,
                    useTo: true
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var oModelStartUp= new sap.ui.model.json.JSONModel();
                oModelStartUp.loadData("/sap/bc/ui2/start_up").then(() => {
                    _startUpInfo = oModelStartUp.oData
                    console.log(oModelStartUp, oModelStartUp.oData);
                });

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYINFOHUMOD",
                    tblSrc: "ZDV_ODF_INF_HU",
                    tblId: "huTab",
                    tblModel: "hu"
                });

                aTableList.push({
                    modCode: "ODFTYINFODTLMOD",
                    tblSrc: "ZDV_ODF_INF_DTL",
                    tblId: "dtlTab",
                    tblModel: "dtl"
                });

                aTableList.push({
                    modCode: "ODFTYINFOSHIPMOD",
                    tblSrc: "ZDV_ODF_INF_SHIP",
                    tblId: "shipTab",
                    tblModel: "ship"
                });

                aTableList.push({
                    modCode: "ODFTYINFOSTATMOD",
                    tblSrc: "ZDV_ODF_INF_STAT",
                    tblId: "statTab",
                    tblModel: "stat"
                });

                aTableList.push({
                    modCode: "ODFTYINFOMDMOD",
                    tblSrc: "ZDV_ODF_INF_MD",
                    tblId: "matDocTab",
                    tblModel: "matDoc"
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

                this.byId("huTab").addEventDelegate(oTableEventDelegate);
                this.byId("dtlTab").addEventDelegate(oTableEventDelegate);
                this.byId("shipTab").addEventDelegate(oTableEventDelegate);
                this.byId("statTab").addEventDelegate(oTableEventDelegate);
                this.byId("matDocTab").addEventDelegate(oTableEventDelegate);

                _this.getHdr();

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                //console.log(pTableId, pTableProps)
            },

            getHdr() {
                _this.showLoadingDialog("Loading...");

                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";
                
                oModel.read("/InfoHeaderSet", {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoHeaderSet read", data);

                        data.results.forEach(item => {
                            if (item.DOCDT !== null)
                                item.DOCDT = _this.formatDate(item.DOCDT);

                            if (item.REQDT !== null)
                                item.REQDT = _this.formatDate(item.REQDT);

                            if (item.POSTDT !== null)
                                item.POSTDT = _this.formatDate(item.POSTDT);

                            if (item.ACTISSDT !== null)
                                item.ACTISSDT = _this.formatDate(item.ACTISSDT);

                            if (item.REFDOCDT !== null)
                                item.REFDOCDT = _this.formatDate(item.REFDOCDT);

                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDate(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDate(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);

                            _this.getView().getModel("ui").setProperty("/useTo", item.USETO);
                        });

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "hdr");

                        _this.setHeaderValue();

                        _this.getHu();
                        _this.getDtl();
                        _this.getShip();
                        _this.getStat();
                        _this.getMatDoc();

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onEditHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");
                if (oData.STATUS == "54" || oData.DELETED == true) {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                _this.setControlEditMode("hdr", true);
            },

            onDeleteHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");

                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.WARN_ALREADY_DELETED);
                    return;
                }

                if (oData.STATUS != "50") {
                    MessageBox.warning(_oCaption.WARN_DELETE_NOT_ALLOW);
                    return;
                }

                MessageBox.confirm(_oCaption.INFO_PROCEED_DELETE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Deleting...");

                            var sEntitySet = "/InfoHeaderTblSet(DLVNO='" + oData.DLVNO + "')";
                            var param = {
                                DELETED: "X"
                            };

                            var oModel = _this.getOwnerComponent().getModel();
                            console.log("onDeleteHeader param", sEntitySet, param)
                            oModel.update(sEntitySet, param, {
                                method: "PUT",
                                success: function(data, oResponse) {
                                    console.log(sEntitySet, data, oResponse);
                                    MessageBox.information(oData.DLVNO + " is now deleted.")
                                    _this.onRefreshHdr();
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    _this.closeLoadingDialog();
                                }
                            });
                        }
                    }
                });
            },

            onPickHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");

                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.WARN_ALREADY_DELETED);
                    return;
                }

                MessageBox.confirm(_oCaption.CONFIRM_PROCEED_EXECUTE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Loading...");

                            var oModelRFC = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                            var oParam = {
                                "GRPID": "1",
                                "MSGTYP": "",
                                "N_TODOC_MSG": []
                            };

                            oParam["N_TODOC"] = [{
                                "GrpID": "1",
                                "Dlvno": oData.DLVNO,
                                "Username": _startUpInfo.id,
                                "Totyp": "04"
                            }]

                            console.log("ImportTODOCSet param", oParam);
                            oModelRFC.create("/ImportTODOCSet", oParam, {
                                method: "POST",
                                success: function(oResult, oResponse) {
                                    console.log("ImportTODOCSet", oResult, oResponse);
                                    if (oResult.N_TODOC_MSG.results[0].Type == "S") {

                                        var sEntitySet = "/InfoHeaderTblSet(DLVNO='" + oData.DLVNO + "')";
                                        var param = {
                                            STATUSCD: "NEW"
                                        };

                                        var oModel = _this.getOwnerComponent().getModel();
                                        console.log("InfoHeaderTblSet param", sEntitySet, param)
                                        oModel.update(sEntitySet, param, {
                                            method: "PUT",
                                            success: function(data, oResponse) {
                                                console.log(sEntitySet, data, oResponse);
                                                
                                                MessageBox.information(_oCaption.INFO_EXECUTE_SUCCESS);
                                                _this.onRefreshHdr();
                                            },
                                            error: function(err) {
                                                console.log("error", err)
                                                _this.closeLoadingDialog();
                                            }
                                        });
                                    } else {
                                        MessageBox.information(oResult.N_TODOC_MSG.results[0].Message);
                                    }
                                },
                                error: function(err) {
                                    MessageBox.error(_oCaption.INFO_EXECUTE_FAIL);
                                    _this.closeLoadingDialog();
                                }
                            });
                        }
                    }
                });
            },

            onPostHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");

                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.WARN_ALREADY_DELETED);
                    return;
                }

                MessageBox.confirm(_oCaption.CONFIRM_PROCEED_EXECUTE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Loading...");

                            var oModelRFC = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                            var oParam = {
                                "iv_dlvno": oData.DLVNO,
                                "iv_userid": _startUpInfo.id,
                                "N_RETURN_MSG": []
                            };

                            console.log("GoodsMvt_PostODSet param", oParam);
                            oModelRFC.create("/GoodsMvt_PostODSet", oParam, {
                                method: "POST",
                                success: function(oResult, oResponse) {
                                    console.log("GoodsMvt_PostODSet", oResult, oResponse);

                                    _this.closeLoadingDialog();
                                    if (oResult.N_RETURN_MSG.results[0].Type == "S") {

                                        MessageBox.information(_oCaption.INFO_EXECUTE_SUCCESS);
                                        _this.onRefreshHdr();
                                    } else {
                                        MessageBox.information(oResult.N_RETURN_MSG.results[0].Message);
                                    }
                                },
                                error: function(err) {
                                    MessageBox.error(_oCaption.INFO_EXECUTE_FAIL);
                                    _this.closeLoadingDialog();
                                }
                            });
                        }
                    }
                });
            },

            onUndoPickHdr() {

            },

            onRefreshHdr() {
                _this.getHdr();
            },

            onCloseHdr() {
                _this.showLoadingDialog("Loading...");

                var oModelLock = _this.getOwnerComponent().getModel("ZGW_3DERP_LOCK_SRV");
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;

                var oParamLock = {
                    Dlvno: sDlvNo,
                    Lock_Unlock_Ind: "",
                    N_LOCK_UNLOCK_DLVHDR_RET: [],
                    N_LOCK_UNLOCK_DLVHDR_MSG: []
                }

                oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                    method: "POST",
                    success: function(data, oResponse) {
                        console.log("Lock_Unlock_DlvHdrSet", data);
                        _this.closeLoadingDialog();
                        _this.onNavBack();

                        // if (data.N_LOCK_UNLOCK_DLVHDR_MSG.results.filter(x => x.Type != "S").length == 0) {
                        //     this._router.navTo("RouteDeliveryInfo", {
                        //         sbu: _this.getView().getModel("ui").getData().sbu,
                        //         dlvNo: sDlvNo
                        //     });
                        // } else {
                        //     var oFilter = data.N_LOCK_UNLOCK_DLVHDR_MSG.results.filter(x => x.Type != "S")[0];
                        //     MessageBox.warning(oFilter.Message);
                        //     _this.closeLoadingDialog();
                        // }
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });   
            },

            onSaveHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");
                var oModel = this.getOwnerComponent().getModel();

                var param = {};
                if (_this.byId("dpDocDt").getValue()) 
                    param.DOCDT = _this.formatDate(new Date(_this.byId("dpDocDt").getValue())) + "T00:00:00";

                if (_this.byId("dpPostDt").getValue()) 
                    param.POSTDT = _this.formatDate(new Date(_this.byId("dpPostDt").getValue())) + "T00:00:00";

                if (_this.byId("dpActIssDt").getValue()) 
                    param.ACTDLVDT = _this.formatDate(new Date(_this.byId("dpActIssDt").getValue())) + "T00:00:00";

                param.REFDOC = _this.byId("iptRefDocNo").getValue();

                if (_this.byId("dpRefDocDt").getValue()) 
                    param.REFDOCDT = _this.formatDate(new Date(_this.byId("dpRefDocDt").getValue())) + "T00:00:00";

                param.HDRTEXT = _this.byId("iptHdrText").getValue();

                var sEntitySet = "/InfoHeaderTblSet(DLVNO='" + oData.DLVNO + "')";

                console.log("InfoHeaderTblSet param", sEntitySet, param)
                oModel.update(sEntitySet, param, {
                    method: "PUT",
                    success: function(data, oResponse) {
                        console.log(sEntitySet, data, oResponse);
                        MessageBox.information(_oCaption.INFO_SAVE_SUCCESS);
                        _this.setControlEditMode("hdr", false);
                        _this.onRefreshHdr();
                    },
                    error: function(err) {
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                });
            },

            onCancelHdr() {
                MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.setControlEditMode("hdr", false);
                        }
                    }
                });
            },

            getHu() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";

                oModel.read('/InfoHUSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoHUSet", data)

                        data.results.forEach(item => {
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDate(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDate(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);
                        })

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "hu");

                        _this.setRowReadMode("hu");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onEditHu() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                if (oDataHdr.STATUS == "54") {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                var aRows = this.getView().getModel("hu").getData().results;
                if (aRows.length > 0 && aRows.length > aRows.filter(x => x.DELETED).length) {
                    _this.byId("btnEditHu").setVisible(false);
                    _this.byId("btnDeleteHu").setVisible(false);
                    _this.byId("btnRefreshHu").setVisible(false);
                    _this.byId("btnSaveHu").setVisible(true);
                    _this.byId("btnCancelHu").setVisible(true);
    
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("hu").getData());
                    _this.setRowEditMode("hu");
                } else {
                    MessageBox.warning(_oCaption.INFO_NO_DATA_EDIT);
                }
            },

            onDeleteHu() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                if (oDataHdr.STATUS != "50") {
                    MessageBox.warning(_oCaption.WARN_DELETE_NOT_ALLOW);
                    return;
                }

                var oTable = this.byId("huTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                MessageBox.confirm(_oCaption.INFO_PROCEED_DELETE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Deleting...");

                            var oModel = _this.getOwnerComponent().getModel();
                            var aData = _this.getView().getModel("hu").getData().results;
                            var iIdx = 0;
            
                            aSelIdx.forEach((i, idx) => {
                                var oData = aData[i];
                                var sEntitySet = "/InfoHUTblSet(DLVNO='" + oData.DLVNO + 
                                    "',DLVITEM='" + oData.DLVITEM + "',SEQNO='" + oData.SEQNO + "')";
                                var param = {
                                    DELETED: 'X'
                                };

                                var oModel = _this.getOwnerComponent().getModel();
                                console.log("InfoHUTblSet param", sEntitySet, param)

                                setTimeout(() => {
                                    oModel.update(sEntitySet, param, {
                                        method: "PUT",
                                        success: function(data, oResponse) {
                                            console.log(sEntitySet, data, oResponse);
    
                                            if (idx == aSelIdx.length - 1) {
                                                _this.onRefreshHu();
                                            }
                                        },
                                        error: function(err) {
                                            console.log("error", err)
                                            _this.closeLoadingDialog();
                                        }
                                    });
                                }, 100);
                            });
                        }
                    }
                });
            },

            onRefreshHu() {
                _this.getHu();
            },

            onSaveHu() {
                var oTable = this.byId("huTab");
                var aEditedRows = this.getView().getModel("hu").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    // Validation UOM
                    var sErrType = "";
                    var sUom = "";
                    var iUomDecimal = 0;

                    aEditedRows.forEach((item, idx) => {
                        var aNum = parseFloat(item.REQQTY).toString().split(".");

                        if (item.UOMDECIMAL == 0) {
                            if (!Number.isInteger(parseFloat(item.TOQTY))) sErrType = "UOMDECIMAL";
                        } else if (item.UOMDECIMAL > 0) {
                            if (aNum.length == 1) sErrType = "UOMDECIMAL";
                            else if (aNum[1].length != item.UOMDECIMAL) sErrType = "UOMDECIMAL";
                        }
                        
                        if (parseFloat(item.REQQTY) > parseFloat(item.NETAVAILQTY)) {
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
                            sErrMsg = "Required Quantity is greater than Net Avail Quantity.";
                        }

                        MessageBox.warning(sErrMsg);
                        return;
                    }

                    aEditedRows.forEach((item, idx) => {
                        _this.showLoadingDialog("Updating...");

                        var sEntitySet = "/InfoHUTblSet(DLVNO='" + item.DLVNO + 
                            "',DLVITEM='" + item.DLVITEM + "',SEQNO='" + item.SEQNO + "')";
                        var param = {
                            REQQTY: item.REQQTY
                        };

                        var oModel = _this.getOwnerComponent().getModel();
                        console.log("InfoHUTblSet param", sEntitySet, param)
                        oModel.update(sEntitySet, param, {
                            method: "PUT",
                            success: function(data, oResponse) {
                                console.log(sEntitySet, data, oResponse);

                                _this.byId("btnEditHu").setVisible(true);
                                _this.byId("btnDeleteHu").setVisible(true);
                                _this.byId("btnRefreshHu").setVisible(true);
                                _this.byId("btnSaveHu").setVisible(false);
                                _this.byId("btnCancelHu").setVisible(false);

                                _this.onRefreshHu();
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

            onCancelHu() {
                var aEditedRows = this.getView().getModel("hu").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {

                                _this.byId("btnEditHu").setVisible(true);
                                _this.byId("btnDeleteHu").setVisible(true);
                                _this.byId("btnRefreshHu").setVisible(true);
                                _this.byId("btnSaveHu").setVisible(false);
                                _this.byId("btnCancelHu").setVisible(false);

                                _this.onRefreshHu();
                            }
                        }
                    });
                } else {
                    _this.byId("btnEditHu").setVisible(true);
                    _this.byId("btnDeleteHu").setVisible(true);
                    _this.byId("btnRefreshHu").setVisible(true);
                    _this.byId("btnSaveHu").setVisible(false);
                    _this.byId("btnCancelHu").setVisible(false);

                    _this.onRefreshHu();
                }
            },

            getDtl() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";

                oModel.read('/InfoDetailSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoDetailSet", data)

                        data.results.forEach(item => {
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDate(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDate(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);
                        })

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "dtl");

                        _this.setRowReadMode("dtl");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAddDtl() {
                var oData = _this.getView().getModel("hdr").getData().results[0];
                
                if (oData.STATUS == "50") {
                    var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                    var sRsvList = "";

                    _this.getView().getModel("dtl").getData().results.forEach(item => {
                        if (!item.DELETED) {
                            sRsvList += item.RSVNO + item.RSVITEM + "|";
                        }
                    });
                    sRsvList = sRsvList.slice(0, -1);

                    setTimeout(() => {
                        _this._router.navTo("RouteReservation", {
                            sbu: _this.getView().getModel("ui").getData().sbu,
                            dlvNo: oDataHdr.DLVNO,
                            dlvType: oDataHdr.DLVTYPE,
                            mvtType: oDataHdr.MVTTYPE,
                            srcTbl: oDataHdr.SRCTBL,
                            noRangeCd: oDataHdr.NORANGECD,
                            rsvList: sRsvList
                        });
                    }, 100);
                } else {
                    MessageBox.information(_oCaption.WARN_ADD_NOT_ALLOW)
                }
            },

            onPickDtl() {
                var oData = _this.getView().getModel("hdr").getData().results[0];
                
                if (oData.STATUS == "50") {
                    _this._router.navTo("RoutePicking", {
                        sbu: _this.getView().getModel("ui").getData().sbu,
                        dlvNo: oData.DLVNO,
                        mvtType: oData.MVTTYPE
                    });
                }
            },

            onDeleteDtl() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                if (oDataHdr.STATUS != "50") {
                    MessageBox.warning(_oCaption.WARN_DELETE_NOT_ALLOW);
                    return;
                }

                var oTable = this.byId("dtlTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                MessageBox.confirm(_oCaption.INFO_PROCEED_DELETE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Deleting...");

                            var oModel = _this.getOwnerComponent().getModel();
                            var aData = _this.getView().getModel("dtl").getData().results;
                            var iIdx = 0;
            
                            aSelIdx.forEach((i, idx) => {
                                var oData = aData[i];
                                var sEntitySet = "/InfoDetailTblSet(DLVNO='" + oData.DLVNO + 
                                    "',DLVITEM='" + oData.DLVITEM + "')";
                                var param = {
                                    DELETED: 'X'
                                };

                                var oModel = _this.getOwnerComponent().getModel();
                                console.log("InfoDetailTblSet param", sEntitySet, param)

                                setTimeout(() => {
                                    oModel.update(sEntitySet, param, {
                                        method: "PUT",
                                        success: function(data, oResponse) {
                                            console.log(sEntitySet, data, oResponse, i);
    
                                            if (idx == aSelIdx.length - 1) {
                                                console.log("refrsh")
                                                _this.onRefreshDtl();
                                            }
                                        },
                                        error: function(err) {
                                            console.log("error", err)
                                            _this.closeLoadingDialog();
                                        }
                                    });
                                }, 100)
                            });
                        }
                    }
                });
            },

            onRefreshDtl() {
                _this.getDtl();
            },

            getShip() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";

                oModel.read('/InfoShipSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoShipSet", data)

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "ship");

                        _this.setRowReadMode("ship");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onEditShip() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                if (oDataHdr.STATUS == "54") {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                var aRows = this.getView().getModel("ship").getData().results;
                if (aRows.length > 0) {
                    _this.byId("btnEditShip").setVisible(false);
                    _this.byId("btnRefreshShip").setVisible(false);
                    _this.byId("btnSaveShip").setVisible(true);
                    _this.byId("btnCancelShip").setVisible(true);
    
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("ship").getData());
                    _this.setRowEditMode("ship");
                } else {
                    MessageBox.warning(_oCaption.INFO_NO_DATA_EDIT);
                }
            },

            onRefreshShip() {
                _this.getShip();
            },

            onSaveShip() {
                var aEditedRows = this.getView().getModel("ship").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    var oModel = this.getOwnerComponent().getModel();
                    var oData = aEditedRows[0];

                    var param = {
                        CARRIER: oData.CARRIER,
                        VOYAGE: oData.VOYAGE,
                        VESSEL: oData.VESSEL,
                        FORWRDR: oData.FORWARDER,
                        FORREFNO: oData.FORREFNO,
                        VOLUME: oData.VOLUME,
                        VOLUOM: oData.VOLUOM,
                        PORTLD: oData.PORTLOAD,
                        PORTDIS: oData.PORTDIS,
                        CONTNO: oData.CONTNO,
                        CONTTYP: oData.CONTTYPE,
                        SEALNO: oData.SEALNO,
                        DEST: oData.DESTINATION,
                        COO: oData.COO,
                        GRSWT: oData.GROSSWT,
                        NETWT: oData.NETWT,
                        WTUOM: oData.WTUOM
                    };
    
                    var sEntitySet = "/InfoHeaderTblSet(DLVNO='" + oData.DLVNO + "')";
    
                    console.log("InfoHeaderTblSet param", sEntitySet, param)
                    oModel.update(sEntitySet, param, {
                        method: "PUT",
                        success: function(data, oResponse) {
                            console.log(sEntitySet, data, oResponse);

                            _this.byId("btnEditShip").setVisible(true);
                            _this.byId("btnRefreshShip").setVisible(true);
                            _this.byId("btnSaveShip").setVisible(false);
                            _this.byId("btnCancelShip").setVisible(false);

                            MessageBox.information(_oCaption.INFO_SAVE_SUCCESS);
                            _this.onRefreshShip();
                        },
                        error: function(err) {
                            console.log("error", err)
                            _this.closeLoadingDialog();
                        }
                    });
                } else {
                    MessageBox.information(_oCaption.WARN_NO_DATA_MODIFIED);
                }
            },

            onCancelShip() {
                var aEditedRows = this.getView().getModel("ship").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {

                                _this.byId("btnEditShip").setVisible(true);
                                _this.byId("btnRefreshShip").setVisible(true);
                                _this.byId("btnSaveShip").setVisible(false);
                                _this.byId("btnCancelShip").setVisible(false);

                                _this.onRefreshShip();
                            }
                        }
                    });
                } else {
                    _this.byId("btnEditShip").setVisible(true);
                    _this.byId("btnRefreshShip").setVisible(true);
                    _this.byId("btnSaveShip").setVisible(false);
                    _this.byId("btnCancelShip").setVisible(false);

                    _this.onRefreshShip();
                }
            },

            getStat() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";

                oModel.read('/InfoStatusSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoStatusSet", data)

                        data.results.forEach(item => {
                            if (item.STARTDT !== null)
                                item.STARTDT = _this.formatDate(item.STARTDT) + " " + _this.formatTime(item.STARTTM);

                            if (item.ENDDT !== null)
                                item.ENDDT = _this.formatDate(item.ENDDT) + " " + _this.formatTime(item.ENDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDate(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);
                        })

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "stat");

                        _this.setRowReadMode("stat");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onRefreshStat() {
                _this.getStat();
            },

            getMatDoc() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";

                oModel.read('/InfoMatDocSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoMatDocSet", data)

                        data.results.forEach(item => {
                            if (item.DOCDT !== null)
                                item.DOCDT = _this.formatDate(item.DOCDT);

                            if (item.POSTDT !== null)
                                item.POSTDT = _this.formatDate(item.POSTDT);
                        })

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "matDoc");

                        _this.setRowReadMode("matDoc");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onRefreshMatDoc() {
                _this.getMatDoc();
            },

            onNavBack() {
                _this._router.navTo("RouteMain", {}, true);
            },

            onInputLiveChange(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var dValue = oEvent.getParameters().value;
                console.log("onInputLiveChange", sModel, sRowPath);
                _this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            },

            onNumberLiveChange(oEvent) {
                var oSource = oEvent.getSource();
                var sRowPath = oSource.getBindingInfo("value").binding.oContext.sPath;
                var sModel = oSource.getBindingInfo("value").parts[0].model;
                var dValue = oEvent.getParameters().value;

                _this.getView().getModel(sModel).setProperty(sRowPath + '/Edited', true);
            },

            setHeaderValue() {
                var oHeader = _this.getView().getModel("hdr").getData().results[0];

                _this.byId("iptDlvNo").setValue(oHeader.DLVNO);
                _this.byId("iptMvtType").setValue(oHeader.MVTTYPE);
                _this.byId("iptStatus").setValue(oHeader.STATUSDESC);
                _this.byId("dpDocDt").setValue(oHeader.DOCDT);
                _this.byId("iptReqDt").setValue(oHeader.REQDT);

                _this.byId("iptWarehouse").setValue(oHeader.WAREHOUSE);
                _this.byId("iptIssPlant").setValue(oHeader.ISSPLANT);
                _this.byId("iptIssSloc").setValue(oHeader.ISSSLOC);
                _this.byId("iptRcvPlant").setValue(oHeader.RCVPLANT);
                _this.byId("iptRcvSloc").setValue(oHeader.RCVSLOC);

                _this.byId("dpPostDt").setValue(oHeader.POSTDT);
                _this.byId("dpActIssDt").setValue(oHeader.ACTISSDT);
                _this.byId("iptRefDocNo").setValue(oHeader.REFDOCNO);
                _this.byId("dpRefDocDt").setValue(oHeader.REFDOCDT);
                _this.byId("iptHdrText").setValue(oHeader.HDRTEXT);

                _this.byId("chkDeleted").setSelected(oHeader.DELETED);
                _this.byId("iptCreatedBy").setValue(oHeader.CREATEDBY);
                _this.byId("iptCreatedDt").setValue(oHeader.CREATEDDT);
                _this.byId("iptUpdatedBy").setValue(oHeader.UPDATEDBY);
                _this.byId("iptUpdatedDt").setValue(oHeader.UPDATEDDT);
            },

            setControlEditMode(pType, pEditable) {

                if (pType == "hdr") {

                    // Header
                    this.byId("btnEditHdr").setVisible(!pEditable);
                    this.byId("btnDeleteHdr").setVisible(!pEditable);
                    this.byId("btnSetStatusHdr").setVisible(!pEditable);
                    this.byId("btnRefreshHdr").setVisible(!pEditable);
                    this.byId("btnPrintHdr").setVisible(!pEditable);
                    this.byId("btnCloseHdr").setVisible(!pEditable);
                    this.byId("btnSaveHdr").setVisible(pEditable);
                    this.byId("btnCancelHdr").setVisible(pEditable);

                    this.setReqField("hdr", pEditable);
                    this.getView().getModel("ui").setProperty("/editModeHdr", pEditable);

                    // HU
                    this.byId("btnEditHu").setEnabled(!pEditable);
                    this.byId("btnDeleteHu").setEnabled(!pEditable);
                    this.byId("btnRefreshHu").setEnabled(!pEditable);

                    // Detail
                    this.byId("btnAddDtl").setEnabled(!pEditable);
                    this.byId("btnPickDtl").setEnabled(!pEditable);
                    this.byId("btnDeleteDtl").setEnabled(!pEditable);
                    this.byId("btnRefreshDtl").setEnabled(!pEditable);

                    // Shipment
                    this.byId("btnEditShip").setEnabled(!pEditable);
                    this.byId("btnRefreshShip").setEnabled(!pEditable);
                    
                    // Status
                    this.byId("btnRefreshStat").setEnabled(!pEditable);

                    // Material Document
                    this.byId("btnRefreshMatDoc").setEnabled(!pEditable);
                }
            },

            setReqField(pType, pEditable) {
                // if (pType == "header") {
                //     var fields = ["feDocDt", "feReqDt", "feIssPlant", "feIssSloc", "feRcvPlant", "feRcvSloc", "feShipMode"];

                //     fields.forEach(id => {
                //         if (pEditable) {
                //             this.byId(id).setLabel("*" + this.byId(id).getLabel());
                //             this.byId(id)._oLabel.addStyleClass("requiredField");
                //         } else {
                //             this.byId(id).setLabel(this.byId(id).getLabel().replaceAll("*", ""));
                //             this.byId(id)._oLabel.removeStyleClass("requiredField");
                //         }
                //     })
                // } else {
                //     var oTable = this.byId(pType + "Tab");

                //     oTable.getColumns().forEach((col, idx) => {
                //         if (col.getLabel().getText().includes("*")) {
                //             col.getLabel().setText(col.getLabel().getText().replaceAll("*", ""));
                //         }

                //         this._aColumns[pType].filter(item => item.label === col.getLabel().getText())
                //             .forEach(ci => {
                //                 if (ci.required) {
                //                     col.getLabel().removeStyleClass("requiredField");
                //                 }
                //             })
                //     })
                // }
            },

            onKeyUp(oEvent) {
                if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    var sModel = "";
                    if (oTable.getId().indexOf("huTab") >= 0) sModel = "hu";
                    else if (oTable.getId().indexOf("dtlTab") >= 0) sModel = "dtl";
                    else if (oTable.getId().indexOf("shipTab") >= 0) sModel = "ship";
                    else if (oTable.getId().indexOf("statTab") >= 0) sModel = "stat";
                    else if (oTable.getId().indexOf("matDocTab") >= 0) sModel = "matDoc";

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

                // Form
                oCaptionParam.push({CODE: "DLVNO"});
                oCaptionParam.push({CODE: "MVTTYPE"});
                oCaptionParam.push({CODE: "STATUS"});
                oCaptionParam.push({CODE: "DOCDT"});
                oCaptionParam.push({CODE: "REQDT"});

                oCaptionParam.push({CODE: "WAREHOUSE"});
                oCaptionParam.push({CODE: "ISSPLANT"});
                oCaptionParam.push({CODE: "ISSSLOC"});
                oCaptionParam.push({CODE: "RCVPLANT"});
                oCaptionParam.push({CODE: "RCVSLOC"});

                oCaptionParam.push({CODE: "POSTDT"});
                oCaptionParam.push({CODE: "ACTISSDT"});
                oCaptionParam.push({CODE: "REFDOCNO"});
                oCaptionParam.push({CODE: "REFDOCDT"});
                oCaptionParam.push({CODE: "HDRTEXT"});

                oCaptionParam.push({CODE: "DELETED"});
                oCaptionParam.push({CODE: "CREATEDBY"});
                oCaptionParam.push({CODE: "CREATEDDT"});
                oCaptionParam.push({CODE: "UPDATEDBY"});
                oCaptionParam.push({CODE: "UPDATEDDT"});

                // Button
                oCaptionParam.push({CODE: "PICK_COMPLETE"});
                oCaptionParam.push({CODE: "POST"});
                oCaptionParam.push({CODE: "UNDO_PICK_COMPLETE"});
                oCaptionParam.push({CODE: "ADD"});
                oCaptionParam.push({CODE: "EDIT"});
                oCaptionParam.push({CODE: "DELETE"});
                oCaptionParam.push({CODE: "REFRESH"});
                oCaptionParam.push({CODE: "SAVE"});
                oCaptionParam.push({CODE: "CANCEL"});
                oCaptionParam.push({CODE: "PRINT"});
                oCaptionParam.push({CODE: "CLOSE"});
                oCaptionParam.push({CODE: "SETSTATUS"});
                oCaptionParam.push({CODE: "PICK"});

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                oCaptionParam.push({CODE: "WARN_EDIT_NOT_ALLOW"});
                oCaptionParam.push({CODE: "CONFIRM_DISREGARD_CHANGE"});
                oCaptionParam.push({CODE: "WARN_ALREADY_DELETED"});
                oCaptionParam.push({CODE: "WARN_DELETE_NOT_ALLOW"});
                oCaptionParam.push({CODE: "INFO_PROCEED_DELETE"});
                oCaptionParam.push({CODE: "INFO_SAVE_SUCCESS"});
                oCaptionParam.push({CODE: "WARN_ADD_NOT_ALLOW"});
                oCaptionParam.push({CODE: "INFO_NO_DATA_EDIT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_EXECUTE"});
                oCaptionParam.push({CODE: "INFO_EXECUTE_SUCCESS"});
                
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