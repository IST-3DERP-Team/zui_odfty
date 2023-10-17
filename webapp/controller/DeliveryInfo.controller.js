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
        var _startUpInfo = {};
        var _aTableProp = [];

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
                    editModeHdrTo: false,
                    useTo: true,
                    forPick: true,
                    rowCountDtl: 0,
                    rowCountHu: 0,
                    rowCountShip: 0,
                    rowCountStat: 0,
                    rowCountMatDoc: 0
                }), "ui");

                _this.initializeComponent();

                if (sap.ui.getCore().byId("backBtn")) {
                    sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = function(oEvent) {
                        _this.onNavBack();
                    }
                }
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                this.getAppAction();

                setTimeout(() => {
                    var bAppChange = _this.getView().getModel("base").getProperty("/appChange");
                    this.setControlAppAction(bAppChange);
                }, 100);
        
                _this.showLoadingDialog("Loading...");

                var oModel = this.getOwnerComponent().getModel();
                if (sap.ushell.Container) {
                    var oModelStartUp= new sap.ui.model.json.JSONModel();
                    oModelStartUp.loadData("/sap/bc/ui2/start_up").then(() => {
                        _startUpInfo = oModelStartUp.oData;
                    });
                }
                else {
                    _startUpInfo.id = "BAS_CONN";
                }

                _aTableProp = [];
                _aTableProp.push({
                    modCode: "ODFTYINFOHUMOD",
                    tblSrc: "ZDV_ODF_INF_HU",
                    tblId: "huTab",
                    tblModel: "hu"
                });

                _aTableProp.push({
                    modCode: "ODFTYINFODTLMOD",
                    tblSrc: "ZDV_ODF_INF_DTL",
                    tblId: "dtlTab",
                    tblModel: "dtl"
                });

                _aTableProp.push({
                    modCode: "ODFTYINFOSHIPMOD",
                    tblSrc: "ZDV_ODF_INF_SHIP",
                    tblId: "shipTab",
                    tblModel: "ship"
                });

                _aTableProp.push({
                    modCode: "ODFTYINFOSTATMOD",
                    tblSrc: "ZDV_ODF_INF_STAT",
                    tblId: "statTab",
                    tblModel: "stat"
                });

                _aTableProp.push({
                    modCode: "ODFTYINFOMDMOD",
                    tblSrc: "ZDV_ODF_INF_MD",
                    tblId: "matDocTab",
                    tblModel: "matDoc"
                });

                // _aTableProp.push({
                //     modCode: "ODFTYINFOOTHMOD",
                //     tblSrc: "ZDV_ODF_INF_ATRB",
                //     tblId: "othInfoTab",
                //     tblModel: "othInfo"
                // });

                _this.getColumns(_aTableProp);

                this._tableRendered = "";
                var oTableEventDelegate = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    },

                    onAfterRendering: function(oEvent) {
                        _this.onAfterTableRendering(oEvent);
                    },

                    onclick: function(oEvent) {
                        _this.onTableClick(oEvent);
                    }
                };

                this.byId("huTab").addEventDelegate(oTableEventDelegate);
                this.byId("dtlTab").addEventDelegate(oTableEventDelegate);
                this.byId("shipTab").addEventDelegate(oTableEventDelegate);
                this.byId("statTab").addEventDelegate(oTableEventDelegate);
                this.byId("matDocTab").addEventDelegate(oTableEventDelegate);
                //this.byId("othInfoTab").addEventDelegate(oTableEventDelegate);

                var oFormEventDelegate = {
                    onclick: function(oEvent) {
                        _this._sActiveTable = "frmHeader";
                    }
                };

                this.byId("frmHeader").addEventDelegate(oFormEventDelegate);

                setTimeout(() => {
                    _this.getHdr();
                }, 1000);

                _this.byId("itbDetails").setSelectedKey("dtl");
               
                _this._sActiveTable = "frmHeader";
                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                console.log(pTableId, pTableProps)
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
                                item.DOCDT = _this.formatDatePH(item.DOCDT);

                            if (item.REQDT !== null)
                                item.REQDT = _this.formatDatePH(item.REQDT);

                            if (item.POSTDT !== null)
                                item.POSTDT = _this.formatDatePH(item.POSTDT);

                            if (item.ACTISSDT !== null)
                                item.ACTISSDT = _this.formatDatePH(item.ACTISSDT);

                            if (item.REFDOCDT !== null)
                                item.REFDOCDT = _this.formatDatePH(item.REFDOCDT);

                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);

                            _this.getView().getModel("ui").setProperty("/useTo", item.USETO);

                            if (item.USETO && item.RFIND) {
                                _this.getView().getModel("ui").setProperty("/forPick", true);
                            }
                            else {
                                _this.getView().getModel("ui").setProperty("/forPick", false);
                            }
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
                        _this.getResources("InfoToSet", "toMethod", "DLVTYPE eq '" + data.results[0].DLVTYPE + "'");
                        //_this.getHuDest();
                        //_this.getOthInfo();

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onEditHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");

                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oData.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                if (oData.STATUS == "54") {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                _this.setControlEditMode("hdr", true);
                _this.getView().getModel("base").setProperty("/dataMode", "EDIT");
            },

            onDeleteHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");

                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oData.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
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

            onForPickHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");
                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oData.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                var aDataStat = _this.getView().getModel("stat").getData().results;
                var oDataStatNext = aDataStat.filter(x => x.DLVSTATCD == "51")[0];
                if (oDataStatNext.PREVSTATCD != oData.STATUS) {
                    var oDataStatPrev = aDataStat.filter(x => x.DLVSTATCD == oDataStatNext.PREVSTATCD)[0];
                    MessageBox.warning("Status should be " + oDataStatPrev.SHORTTEXT + ".");
                    return;
                }

                var aDataHu = _this.getView().getModel("hu").getData().results;
                if (aDataHu.filter(x => x.DELETED == false).length == 0) {
                    MessageBox.warning(_oCaption.INFO_NO_VALID_DLVHU);
                    return;
                }

                

                MessageBox.confirm(_oCaption.CONFIRM_OD_PICK, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Loading...");

                            var oModelRFC = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                            var oParamGetNumber = {};
            
                            oParamGetNumber["N_GetNumberParam"] = [{
                                IUserid: _startUpInfo.id,
                                INorangecd: oData.NORANGECD,
                                IKeycd: ""
                            }];
                            oParamGetNumber["N_GetNumberReturn"] = [];
            
                            oModelRFC.create("/GetNumberSet", oParamGetNumber, {
                                method: "POST",
                                success: function(oResult, oResponse) {
                                    console.log("GetNumberSet", oResult, oResponse);
            
                                    if (oResult.EReturnno.length > 0) {
                                        _this.onPopulateTo(oResult.EReturnno);
                                    } else {
                                        var sMessage = oResult.N_GetNumberReturn.results[0].Type + ' - ' + oResult.N_GetNumberReturn.results[0].Message;
                                        MessageBox.error(sMessage);
                                        _this.closeLoadingDialog();
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

            onPopulateTo(pToNo) {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "' and TONO eq '" + pToNo + "'";

                oModel.read('/ToHdrTblSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("ToHdrTblSet", data)
                        MessageBox.information(_oCaption.INFO_OD_FORPICK_COMPLETE);
                        _this.onRefreshHdr();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onPickHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");
                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oData.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                var aDataStat = _this.getView().getModel("stat").getData().results;
                var oDataStatNext = aDataStat.filter(x => x.DLVSTATCD == "52")[0];
                if (oDataStatNext.PREVSTATCD != oData.STATUS) {
                    var oDataStatPrev = aDataStat.filter(x => x.DLVSTATCD == oDataStatNext.PREVSTATCD)[0];
                    MessageBox.warning("Status should be " + oDataStatPrev.SHORTTEXT + ".");
                    return;
                }

                var aDataHu = _this.getView().getModel("hu").getData().results;
                if (aDataHu.filter(x => x.DELETED == false).length == 0) {
                    MessageBox.warning(_oCaption.INFO_NO_VALID_DLVHU);
                    return;
                }

                MessageBox.confirm(_oCaption.CONFIRM_OD_PICK, {
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
                                    if (oResult.N_TODOC_MSG.results.length == 0 || oResult.N_TODOC_MSG.results[0].Type == "S") {

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
                                                
                                                MessageBox.information(_oCaption.INFO_OD_PICKED);
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
                    MessageBox.warning(_oCaption.DLVNO + " " + oData.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                var aDataStat = _this.getView().getModel("stat").getData().results;
                var oDataStatNext = aDataStat.filter(x => x.DLVSTATCD == "54")[0];
                if (oDataStatNext.PREVSTATCD != oData.STATUS) {
                    var oDataStatPrev = aDataStat.filter(x => x.DLVSTATCD == oDataStatNext.PREVSTATCD)[0];
                    MessageBox.warning("Status should be " + oDataStatPrev.SHORTTEXT + ".");
                    return;
                }

                MessageBox.confirm(_oCaption.CONFIRM_OD_POST, {
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

                                        MessageBox.information(_oCaption.INFO_OD_POSTED);
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

            onReverseHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");

                if (oData.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oData.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                if (oData.STATUS != "54") {
                    MessageBox.warning(_oCaption.WARN_STATUS_POSTED_REVERSE);
                    return;
                }

                var oJSONModel = new JSONModel();
                oJSONModel.setData({
                    postDt: oData.POSTDT
                })

                _this._Reverse = sap.ui.xmlfragment(_this.getView().getId(), "zuiodfty.view.fragments.dialog.Reverse", _this);
                _this._Reverse.setModel(oJSONModel);
                _this.getView().addDependent(_this._Reverse);

                _this._Reverse.addStyleClass("sapUiSizeCompact");
                _this._Reverse.open();

                // MessageBox.confirm(_oCaption.CONFIRM_PROCEED_EXECUTE, {
                //     actions: ["Yes", "No"],
                //     onClose: function (sAction) {
                //         if (sAction === "Yes") {
                //             _this.showLoadingDialog("Loading...");

                //             var oModelRFC = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                //             var oParam = {
                //                 "iv_dlvno": oData.DLVNO,
                //                 "iv_userid": _startUpInfo.id,
                //                 "iv_pstngdt": _this.formatDate(new Date(oData.POSTDT)) + "T00:00:00", 
                //                 "N_IDOD_ET_CANC": [],
                //                 "N_IDOD_RETURN": []
                //             };

                //             console.log("IDOD_ReverseSet param", oParam);
                //             oModelRFC.create("/IDOD_ReverseSet", oParam, {
                //                 method: "POST",
                //                 success: function(oResult, oResponse) {
                //                     console.log("IDOD_ReverseSet", oResult, oResponse);

                //                     _this.closeLoadingDialog();
                //                     if (oResult.N_IDOD_ET_CANC.results) { //oResult.N_IDOD_ET_CANC.results[0].Type == "S"

                //                         MessageBox.information(oResult.N_IDOD_ET_CANC.results[0].Message);
                //                         //MessageBox.information(_oCaption.INFO_EXECUTE_SUCCESS);
                //                         _this.onRefreshHdr();
                //                     } else {
                //                         MessageBox.information(oResult.N_IDOD_RETURN.results[0].Message);
                //                     }
                //                 },
                //                 error: function(err) {
                //                     MessageBox.error(_oCaption.INFO_EXECUTE_FAIL);
                //                     _this.closeLoadingDialog();
                //                 }
                //             });
                //         }
                //     }
                // });
            },

            onProceedReverse(oEvent) {
                _this.showLoadingDialog();

                var oModel = this.getOwnerComponent().getModel();
                var sUser = _startUpInfo.id;
                //var sPostDt = _this.byId("dpReversePostDt").getValue();
                var sPostDt = new Date(_this.byId("dpReversePostDt").getValue());
                //var sBuperDt = sPostDt.toString().substr(0, 7).replace("-", "").replace("/", "");
                var sBuperDt =  sPostDt.getFullYear() +  ('0' + (sPostDt.getMonth() + 1)).slice(-2)
                var sFilter = "USNAM eq '" + sUser + "' and BUPER_FROM eq '" + sBuperDt + "'";

                console.log("ReverseSet param", sFilter);
                oModel.read("/ReverseSet", {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("ReverseSet read", data);

                        if (data.results.length > 0) {
                            var oModelRFC = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                            var oDataHdr = _this.getView().getModel("hdr").getProperty("/results/0");
                            var oParam = {
                                "iv_dlvno": oDataHdr.DLVNO,
                                "iv_userid": _startUpInfo.id,
                                "iv_pstngdt": _this.formatDate(new Date(oDataHdr.POSTDT)) + "T00:00:00", 
                                "N_IDOD_ET_CANC": [],
                                "N_IDOD_RETURN": []
                            };

                            console.log("IDOD_ReverseSet param", oParam);
                            oModelRFC.create("/IDOD_ReverseSet", oParam, {
                                method: "POST",
                                success: function(oResult, oResponse) {
                                    console.log("IDOD_ReverseSet", oResult, oResponse);

                                    _this.closeLoadingDialog();
                                    if (oResult.N_IDOD_ET_CANC.results && oResult.N_IDOD_ET_CANC.results.length > 0) { //oResult.N_IDOD_ET_CANC.results[0].Type == "S"
                                        MessageBox.information(oResult.N_IDOD_ET_CANC.results[0].Message);
                                        //MessageBox.information(_oCaption.INFO_EXECUTE_SUCCESS);
                                        _this.onRefreshHdr();
                                        _this.onCancelReverse();
                                    } else {
                                        MessageBox.information(oResult.N_IDOD_RETURN.results[0].Message);
                                    }
                                },
                                error: function(err) {
                                    MessageBox.error(_oCaption.INFO_EXECUTE_FAIL);
                                    _this.closeLoadingDialog();
                                }
                            });
                        }
                        else {
                            MessageBox.information(_oCaption.POSTDT + " " + _oCaption.INFO_IS_NOT_VALID);
                        }

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onCancelReverse() {
                _this._Reverse.destroy(true);
            },

            onUndoPickHdr() {

            },

            onRefreshHdr() {
                _this.getHdr();
            },

            onCloseHdr() {
                _this.onNavBack();

                // var bAppChange = _this.getView().getModel("base").getProperty("/appChange");

                // if (bAppChange) {
                //     _this.showLoadingDialog("Loading...");

                //     var oModelLock = _this.getOwnerComponent().getModel("ZGW_3DERP_LOCK_SRV");
                //     var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
    
                //     var oParamLock = {
                //         Dlvno: sDlvNo,
                //         Lock_Unlock_Ind: "",
                //         N_LOCK_UNLOCK_DLVHDR_RET: [],
                //         N_LOCK_UNLOCK_DLVHDR_MSG: []
                //     }
    
                //     oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                //         method: "POST",
                //         success: function(data, oResponse) {
                //             console.log("Lock_Unlock_DlvHdrSet", data);
                //             _this.closeLoadingDialog();
                //             _this.onNavBack();
    
                //             // if (data.N_LOCK_UNLOCK_DLVHDR_MSG.results.filter(x => x.Type != "S").length == 0) {
                //             //     this._router.navTo("RouteDeliveryInfo", {
                //             //         sbu: _this.getView().getModel("ui").getData().sbu,
                //             //         dlvNo: sDlvNo
                //             //     });
                //             // } else {
                //             //     var oFilter = data.N_LOCK_UNLOCK_DLVHDR_MSG.results.filter(x => x.Type != "S")[0];
                //             //     MessageBox.warning(oFilter.Message);
                //             //     _this.closeLoadingDialog();
                //             // }
                //         },
                //         error: function(err) {
                //             MessageBox.error(err);
                //             _this.closeLoadingDialog();
                //         }
                //     });
                // } else {
                //     _this.onNavBack();
                // }
            },

            onSaveHdr() {
                var oData = _this.getView().getModel("hdr").getProperty("/results/0");
                var oModel = this.getOwnerComponent().getModel();

                var param = {};
                param.TOMETHOD = _this.byId("iptToMethod").getSelectedKey();

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
                        _this.getView().getModel("base").setProperty("/dataMode", "READ");
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
                            _this.setHeaderValue();
                            _this.getView().getModel("base").setProperty("/dataMode", "READ");
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
                        _this.setControlEditMode("hu", false);

                        data.results.forEach((item, idx) => {
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);

                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        var oTable = _this.getView().byId("huTab");
                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "hu");

                        _this.onFilterByCol("hu", aFilterTab);

                        _this.setRowReadMode("hu");

                        // Set row count
                        _this.getView().getModel("ui").setProperty("/rowCountHu", data.results.length);

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

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                if (oDataHdr.STATUS != "50" || oDataHdr.RFIND) {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                var aRows = this.getView().getModel("hu").getData().results;
                if (aRows.length > 0 && aRows.length > aRows.filter(x => x.DELETED).length) {
                    _this.setControlEditMode("hu", true);
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("hu").getData());
                    _this.setRowEditMode("hu");
                    _this.setActiveRowFocus("hu");
                } else {
                    MessageBox.warning(_oCaption.INFO_NO_DATA_EDIT);
                }
            },

            onDeleteHu() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

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

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                MessageBox.confirm(_oCaption.INFO_PROCEED_DELETE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Deleting...");

                            var oModel = _this.getOwnerComponent().getModel();
                            var aData = _this.getView().getModel("hu").getData().results;
                            var iIdx = 0;
            
                            aOrigSelIdx.forEach((i, idx) => {
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
    
                                            if (idx == aOrigSelIdx.length - 1) {
                                                _this.onRefreshDtl();
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
                        console.log("aEditedRows", item)
                        if (item.UOMDECIMAL == 0) {
                            if (parseInt(aNum[1]) > 0) sErrType = "UOMDECIMAL";
                            //if (!Number.isInteger(parseFloat(item.TOQTY))) sErrType = "UOMDECIMAL";
                        } else if (item.UOMDECIMAL > 0) {
                            if (aNum.length == 1) sErrType = "UOMDECIMAL";
                            else if (aNum[1].length != item.UOMDECIMAL) sErrType = "UOMDECIMAL";
                        }
                        
                        if (parseFloat(item.REQQTY) > parseFloat(item.NETAVAILQTY)) {
                            sErrType = "OVERQTY";
                        }

                        if (item.HUTYPE == "ROL") {
                            if (item.NETAVAILQTY == item.ACTQTY && item.HUID != item.DESTHUID) sErrType = "HUNOEDIT";
                            else if (item.NETAVAILQTY != item.ACTQTY && item.HUID == item.DESTHUID) sErrType = "HUNOEQUAL";
                        }
                        else sErrType = "HUNOEQUAL";

                        if (sErrType) {
                            sUom = item.UOM;
                            iUomDecimal = item.UOMDECIMAL;
                        }

                        var oDataDtl = _this.getView().getModel("dtl").getData().results.filter(
                            x => x.DLVNO == item.DLVNO && x.DLVITEM == item.DLVITEM
                        )[0];
                        var aDataHu = _this.getView().getModel("hu").getData().results.filter(
                            x => x.DLVNO == oDataDtl.DLVNO && x.DLVITEM == oDataDtl.DLVITEM
                        )
                        
                        var dQtyTotal = 0.0;
                        aDataHu.forEach(x => { dQtyTotal += parseFloat(x.ACTQTY); });

                        if (oDataDtl.REQQTYRESTRICT == true && oDataDtl.REQQTY < dQtyTotal) sErrType = "REQQTYRESTRICT";
                    });

                    if (sErrType) {
                        var sErrMsg = "";
                        
                        if (sErrType == "UOMDECIMAL") {
                            sErrMsg = "UOM " + sUom + " should only have " + iUomDecimal.toString() + " decimal place(s).";
                        } else if (sErrType == "OVERQTY") {
                            sErrMsg = "Required Quantity is greater than Net Avail Quantity.";
                        } else if (sErrType == "REQQTYRESTRICT") {
                            sErrMsg = "Total Actual Quantity should not be more than Delivery Detail required quantity."
                        } else if (sErrType == "HUNOEDIT") {
                            sErrMsg = "Destination HUID is not editable."
                        } else if (sErrType == "HUNOEQUAL") {
                            sErrMsg = "Destination HUID should not be equal to HUID."
                        }

                        MessageBox.warning(sErrMsg);
                        return;
                    }

                    aEditedRows.forEach((item, idx) => {
                        _this.showLoadingDialog("Updating...");

                        var sEntitySet = "/InfoHUTblSet(DLVNO='" + item.DLVNO + 
                            "',DLVITEM='" + item.DLVITEM + "',SEQNO='" + item.SEQNO + "')";
                        var param = {
                            ACTQTYBSE: item.ACTQTY,
                            ACTQTYORD: item.ACTQTY,
                            NEWHUID: item.DESTHUID,
                            DELETED: ""
                        };

                        var oModel = _this.getOwnerComponent().getModel();
                        console.log("InfoHUTblSet param", sEntitySet, param)
                        oModel.update(sEntitySet, param, {
                            method: "PUT",
                            success: function(data, oResponse) {
                                console.log(sEntitySet, data, oResponse);
                                _this.onRefreshDtl();
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
                                _this.onRefreshHu();
                            }
                        }
                    });
                } else {
                    _this.onRefreshHu();
                }
            },

            getHuDest() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var oHdr = _this.getView().getModel("hdr").getData().results[0];
                
                var sFilter = "HUTYPE eq '' and PLANTCD eq '" + oHdr.ISSPLANT + "' and SLOC eq '' and WAREHOUSE eq '" + 
                    oHdr.WAREHOUSE + "' and STORAGEAREA eq '" + oHdr.STORAGEAREA + "'";

                oModel.read('/InfoHUDestSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoHUDestSet", data);

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "huDest");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
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

                        data.results.forEach((item, idx) => {
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);

                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        var oTable = _this.getView().byId("dtlTab");
                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "dtl");
                        _this._tableRendered = "dtlTab";

                        _this.onFilterByCol("dtl", aFilterTab);

                        _this.setRowReadMode("dtl");

                        // Set row count
                        _this.getView().getModel("ui").setProperty("/rowCountDtl", data.results.length);

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAddDtl() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }
                
                if (oDataHdr.STATUS == "50") {
                    var sRsvList = "";
                    var sVarCd = "";

                    _this.getView().getModel("dtl").getData().results.forEach((item, idx) => {
                        if (!item.DELETED) {
                            sRsvList += item.RSVNO + item.RSVITEM + "|";
                        }

                        if (idx == 0) sVarCd = (item.VARCD.length > 0 ? item.VARCD : "empty");
                    });
                    sRsvList = sRsvList.slice(0, -1);
                    if (sRsvList.length == 0) sRsvList = "empty";

                    var aDlvItem = _this.getView().getModel("dtl").getData().results.map(item => { return parseFloat(item.DLVITEM) });
                    var maxDlvItem = Math.max(...aDlvItem);

                    _this._router.navTo("RouteReservation", {
                        sbu: _this.getView().getModel("ui").getData().sbu,
                        dlvNo: oDataHdr.DLVNO,
                        dlvType: oDataHdr.DLVTYPE,
                        mvtType: oDataHdr.MVTTYPE,
                        srcTbl: oDataHdr.SRCTBL,
                        varCd: sVarCd,
                        noRangeCd: oDataHdr.NORANGECD,
                        rsvList: sRsvList,
                        dtlMaxCount: maxDlvItem
                    });

                    // setTimeout(() => {
                    //     _this._router.navTo("RouteReservation", {
                    //         sbu: _this.getView().getModel("ui").getData().sbu,
                    //         dlvNo: oDataHdr.DLVNO,
                    //         dlvType: oDataHdr.DLVTYPE,
                    //         mvtType: oDataHdr.MVTTYPE,
                    //         srcTbl: oDataHdr.SRCTBL,
                    //         noRangeCd: oDataHdr.NORANGECD,
                    //         rsvList: sRsvList
                    //     });
                    // }, 100);
                } else {
                    MessageBox.information(_oCaption.WARN_ADD_NOT_ALLOW)
                }
            },

            onPickDtlAuto() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                if (oDataHdr.STATUS != "50" || oDataHdr.RFIND) {
                    MessageBox.warning(_oCaption.WARN_PICK_NOT_ALLOW);
                    return;
                }

                var oTable = this.byId("dtlTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                var aData = _this.getView().getModel("dtl").getData().results;
                var bErr = false;
                var iValidRows = 0;
                var iDeleteRows = 0;
                for (var i = 0; i < aOrigSelIdx.length; i ++) {
                    var oData = aData[aOrigSelIdx[i]];

                    if (oData.DELETED == true) {
                        iDeleteRows += 1;
                        // MessageBox.information(_oCaption.INFO_SEL_RECORD + " " + _oCaption.INFO_ALREADY_DELETED);
                        // bErr = true;
                        // break;
                    }
                    else if (parseFloat(oData.REQQTY) <= parseFloat(oData.ACTQTY)) {
                        MessageBox.information(_oCaption.INFO_SEL_RECORD + " " + _oCaption.INFO_NO_BALANCE);
                        bErr = true;
                        break;
                    }
                    else {
                        iValidRows += 1;
                    }
                }

                if (bErr) return;

                if (iDeleteRows > 0 && iValidRows == 0) {
                    MessageBox.information(_oCaption.INFO_SEL_RECORD + " " + _oCaption.INFO_ALREADY_DELETED);
                    return;
                }

                MessageBox.confirm(_oCaption.CONFIRM_AUTO_PICK, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Loading...");

                            aOrigSelIdx.forEach((i, idx) => {
                                var oData = aData[i];
                                if (oData.DELETED == false) {
                                    var bRefresh = false;

                                    if (idx == aOrigSelIdx.length - 1) {
                                        bRefresh = true;
                                    }
    
                                    _this.setPickAuto(oData, bRefresh);
                                }
                            })
                        }
                    }
                });
            },

            setPickAuto(pData, pRefresh) {
                var oModel = _this.getOwnerComponent().getModel();
                var sFilter = "DLVNO eq '" + pData.DLVNO + "' and DLVITEM eq '" + pData.DLVITEM + "'";

                oModel.read("/InfoDetailAutoSet", {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoDetailAutoSet read", data);

                        if (pRefresh == true) {
                            _this.onRefreshDtl();
                            _this.onRefreshHu();
                        }

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
            },

            onPickDtlManual() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }
                
                if (oDataHdr.STATUS == "50" && !oDataHdr.RFIND) {
                    _this._router.navTo("RoutePicking", {
                        sbu: _this.getView().getModel("ui").getData().sbu,
                        dlvNo: oDataHdr.DLVNO,
                        mvtType: oDataHdr.MVTTYPE
                    });
                }
                else {
                    MessageBox.warning(_oCaption.WARN_PICK_NOT_ALLOW);
                    return;
                }
            },

            onDeleteDtl() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

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

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                MessageBox.confirm(_oCaption.INFO_PROCEED_DELETE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            _this.showLoadingDialog("Deleting...");

                            var oModel = _this.getOwnerComponent().getModel();
                            var aData = _this.getView().getModel("dtl").getData().results;
                            var iIdx = 0;
            
                            aOrigSelIdx.forEach((i, idx) => {
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
    
                                            if (idx == aOrigSelIdx.length - 1) {
                                                console.log("refrsh")
                                                _this.onRefreshDtl();
                                                _this.onRefreshHu();
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
                        console.log("InfoShipSet", data);

                        data.results.forEach((item, idx) => {
                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        _this.setControlEditMode("ship", false);

                        var oTable = _this.getView().byId("shipTab");
                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "ship");
                        
                        _this.onFilterByCol("ship", aFilterTab);

                        _this.setRowReadMode("ship");

                        // Set row count
                        _this.getView().getModel("ui").setProperty("/rowCountShip", data.results.length);

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

                if (oDataHdr.DELETED) {
                    MessageBox.warning(_oCaption.DLVNO + " " + oDataHdr.DLVNO + " " + _oCaption.INFO_IS_ALREADY_DELETED);
                    return;
                }

                if (oDataHdr.STATUS == "54") {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                var aRows = this.getView().getModel("ship").getData().results;
                if (aRows.length > 0) {
                    _this.setControlEditMode("ship", true);
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
                                 _this.onRefreshShip();
                            }
                        }
                    });
                } else {
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

                        data.results.forEach((item, idx) => {
                            if (item.STARTDT !== null)
                                item.STARTDT = _this.formatDatePH(item.STARTDT) + " " + _this.formatTime(item.STARTTM);

                            if (item.ENDDT !== null)
                                item.ENDDT = _this.formatDatePH(item.ENDDT) + " " + _this.formatTime(item.ENDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);

                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        var oTable = _this.getView().byId("statTab");
                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "stat");

                        _this.onFilterByCol("stat", aFilterTab);

                        _this.setRowReadMode("stat");

                        // Set row count
                        _this.getView().getModel("ui").setProperty("/rowCountStat", data.results.length);

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

                        data.results.forEach((item, idx) => {
                            if (item.DOCDT !== null)
                                item.DOCDT = _this.formatDatePH(item.DOCDT);

                            if (item.POSTDT !== null)
                                item.POSTDT = _this.formatDatePH(item.POSTDT);

                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        var oTable = _this.getView().byId("matDocTab");
                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "matDoc");

                        _this.onFilterByCol("matDoc", aFilterTab);

                        _this.setRowReadMode("matDoc");

                        // Set row count
                        _this.getView().getModel("ui").setProperty("/rowCountMatDoc", data.results.length);

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

            getOthInfo() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;
                var sFilter = "DLVNO eq '" + sDlvNo + "'";

                oModel.read('/InfoAttribSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("InfoAttribSet", data);
                        _this.setControlEditMode("othInfo", false);

                        data.results.forEach(item => {
                            if (item.CREATEDDT !== null)
                                item.CREATEDDT = _this.formatDatePH(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                            if (item.UPDATEDDT !== null)
                                item.UPDATEDDT = _this.formatDatePH(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);
                        })

                        var oJSONModel = new sap.ui.model.json.JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "othInfo");

                        _this.setRowReadMode("othInfo");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAddOthInfo() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                if (oDataHdr.STATUS == "54") {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                _this.setControlEditMode("othInfo", true);
                _this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("othInfo").getData());
                _this.setRowCreateMode("othInfo");
            },

            onEditOthInfo() {
                var oDataHdr = _this.getView().getModel("hdr").getData().results[0];
                if (oDataHdr.STATUS == "54") {
                    MessageBox.warning(_oCaption.WARN_EDIT_NOT_ALLOW);
                    return;
                }

                var aRows = this.getView().getModel("othInfo").getData().results;
                if (aRows.length > 0) {
                    _this.setControlEditMode("othInfo", true);
                    this._oDataBeforeChange = jQuery.extend(true, {}, this.getView().getModel("othInfo").getData());
                    _this.setRowEditMode("othInfo");
                } else {
                    MessageBox.warning(_oCaption.INFO_NO_DATA_EDIT);
                }
            },

            onAddRowOthInfo() {
                _this.setRowCreateMode("othInfo");
            },

            onRemoveRowOthInfo() {
                var sModel = "othInfo";
                var oTable = _this.byId("othInfoTab");
                var aNewRows = _this.getView().getModel(sModel).getData().results.filter(item => item.NEW === true);
                aNewRows.splice(oTable.getSelectedIndices(), 1);
                _this.getView().getModel(sModel).setProperty("/results", aNewRows);
            },

            onSaveOthInfo() {
                _this.showLoadingDialog("Loading...");
                var sModel = "othInfo";

                var aNewRows = this.getView().getModel(sModel).getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel(sModel).getData().results.filter(item => item.Edited === true);
                
                var aNewEditRows = aNewRows.length > 0 ? aNewRows : aEditedRows;

                var isValid = true;
                var sInvalidMsg = "";
                var aRequiredFields = this._aColumns[sModel].filter(x => x.required).map(x => x.name);

                for (var i = 0; i < aRequiredFields.length; i++) {
                    var sRequiredField = aRequiredFields[i];
                    if (aNewEditRows.filter(x => !x[sRequiredField]).length > 0) {
                        isValid = false;
                        sInvalidMsg = "\"" + this._aColumns[sModel].filter(x => x.name == sRequiredField)[0].label + "\" is required."
                        break;
                    }
                }

                if (!isValid) {
                    var bCompact = true;
                    MessageBox.error(sInvalidMsg);

                    _this.closeLoadingDialog();
                    return;
                }

                if (aNewRows.length > 0) {
                    var oModel = this.getOwnerComponent().getModel();
                    var entitySet = "/InfoAttribTblSet";
                    var iNew = 0;

                    aNewRows.forEach((item, idx) => {
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
                    })

                    var sEntitySet = "/InfoHeaderTblSet(DLVNO='" + oData.DLVNO + "')";
    
                    console.log("InfoHeaderTblSet param", sEntitySet, param)
                    oModel.update(sEntitySet, param, {
                        method: "PUT",
                        success: function(data, oResponse) {
                            console.log(sEntitySet, data, oResponse);

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

            onCancelOthInfo() {
                var aNewRows = this.getView().getModel("othInfo").getData().results.filter(item => item.NEW === true);
                var aEditedRows = this.getView().getModel("othInfo").getData().results.filter(item => item.Edited === true);

                if (aEditedRows.length > 0) {
                    MessageBox.confirm(_oCaption.CONFIRM_DISREGARD_CHANGE, {
                        actions: ["Yes", "No"],
                        onClose: function (sAction) {
                            if (sAction == "Yes") {
                                 _this.onRefreshOthInfo();
                            }
                        }
                    });
                } else {
                    _this.onRefreshOthInfo();
                }
            },

            onDeleteOthInfo() {

            },

            onRefreshOthInfo() {
                _this.getOthInfo();
            },

            getResources(pEntitySet, pModel, pFilter) {
                var oModel = this.getOwnerComponent().getModel();
                var oJSONModel = new JSONModel();
                var oEntitySet = "/" + pEntitySet;
                var oFilter = (pFilter ? { "$filter": pFilter } : {} )

                oModel.read(oEntitySet, {
                    urlParameters: oFilter,
                    success: function (data, response) {
                        //console.log("getResources", pEntitySet, pModel, data, pFilter)
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, pModel);
                    },
                    error: function (err) {
                    }
                })
            },

            onAddHK() {
                if (_this.getView().getModel("base").getData().dataMode == "READ" && _this.getView().getModel("base").getData().appChange) {
                    if (this._sActiveTable === "dtlTab") this.onAddDtl();
                }
            },

            onEditHK() {
                if (_this.getView().getModel("base").getData().dataMode == "READ"  && _this.getView().getModel("base").getData().appChange) {
                    if (this._sActiveTable === "frmHeader") this.onEditHdr();
                    else if (this._sActiveTable === "huTab") this.onEditHu();
                    else if (this._sActiveTable === "shipTab") this.onEditShip();
                }
            },

            onDeleteHK() {
                if (_this.getView().getModel("base").getData().dataMode == "READ"  && _this.getView().getModel("base").getData().appChange) {
                    if (this._sActiveTable === "frmHeader") this.onDeleteHdr();
                    else if (this._sActiveTable === "dtlTab") this.onDeleteDtl();
                    else if (this._sActiveTable === "huTab") this.onDeleteHu();
                }
            },

            onSaveHK() {
                if ((_this.getView().getModel("base").getData().dataMode == "NEW" || 
                    _this.getView().getModel("base").getData().dataMode == "EDIT")  && 
                    _this.getView().getModel("base").getData().appChange) {
                    if (this._sActiveTable === "frmHeader") this.onSaveHdr();
                    else if (this._sActiveTable === "huTab") this.onSaveHu();
                    else if (this._sActiveTable === "shipTab") this.onSaveShip();
                }
            },

            onCancelHK() {
                console.log(_this.getView().getModel("base").getData(), this._sActiveTable)
                if ((_this.getView().getModel("base").getData().dataMode == "NEW" || 
                    _this.getView().getModel("base").getData().dataMode == "EDIT")  && 
                    _this.getView().getModel("base").getData().appChange) {
                    if (this._sActiveTable === "frmHeader") this.onCancelHdr();
                    else if (this._sActiveTable === "huTab") this.onCancelHu();
                    else if (this._sActiveTable === "shipTab") this.onCancelShip();
                }
            },

            onRefreshHK() {
                if (_this.getView().getModel("base").getData().dataMode == "READ") {
                    if (this._sActiveTable === "frmHeader") this.onRefreshHdr();
                    else if (this._sActiveTable === "dtlTab") this.onRefreshDtl();
                    else if (this._sActiveTable === "huTab") this.onRefreshHu();
                    else if (this._sActiveTable === "shipTab") this.onRefreshShip();
                    else if (this._sActiveTable === "statTab") this.onRefreshStat();
                    else if (this._sActiveTable === "matDocTab") this.onRefreshMatDoc();
                }
            },

            onNavBack() {
                console.log("onNavBack");
                //_this._router.navTo("RouteMain", {}, true);
                _this.unlockData();
            },

            unlockData() {
                var bAppChange = _this.getView().getModel("base").getProperty("/appChange");

                if (bAppChange) {
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
                            _this.onClosePage();
                        },
                        error: function(err) {
                            MessageBox.error(err);
                            _this.closeLoadingDialog();
                        }
                    });
                } else {
                    _this.onClosePage();
                }
            },

            onClosePage() {
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
                _this.byId("iptMvtType").setValue(oHeader.MVTTYPEDESC);
                _this.byId("iptToMethod").setSelectedKey(oHeader.TOMETHOD);
                _this.byId("dpDocDt").setValue(oHeader.DOCDT);
                _this.byId("iptReqDt").setValue(oHeader.REQDT);

                _this.byId("iptWarehouse").setValue(oHeader.WAREHOUSE);
                _this.byId("iptIssPlant").setValue(oHeader.ISSPLANTDESC);
                _this.byId("iptIssSloc").setValue(oHeader.ISSSLOCDESC);
                _this.byId("iptRcvPlant").setValue(oHeader.RCVPLANTDESC);
                _this.byId("iptRcvSloc").setValue(oHeader.RCVSLOCDESC);

                _this.byId("dpPostDt").setValue(oHeader.POSTDT);
                _this.byId("dpActIssDt").setValue(oHeader.ACTISSDT);
                _this.byId("iptRefDocNo").setValue(oHeader.REFDOCNO);
                _this.byId("dpRefDocDt").setValue(oHeader.REFDOCDT);
                _this.byId("iptHdrText").setValue(oHeader.HDRTEXT);

                _this.byId("iptStatus").setValue(oHeader.STATUSDESC);
                _this.byId("iptCreatedBy").setValue(oHeader.CREATEDBY);
                _this.byId("iptCreatedDt").setValue(oHeader.CREATEDDT);
                _this.byId("iptUpdatedBy").setValue(oHeader.UPDATEDBY);
                _this.byId("iptUpdatedDt").setValue(oHeader.UPDATEDDT);
                _this.byId("chkDeleted").setSelected(oHeader.DELETED);
            },

            setControlEditMode(pType, pEditable, pAdd) {
                
                var bAppChange = _this.getView().getModel("base").getProperty("/appChange");

                if (bAppChange) {
                    if (sap.ushell.Container) sap.ushell.Container.setDirtyFlag(pEditable);

                    var oDataHdr = _this.getView().getModel("hdr").getProperty("/results/0");
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

                        if (pEditable == true && oDataHdr.STATUS == "50") {
                            this.getView().getModel("ui").setProperty("/editModeHdrTo", true);
                        }
                        else {
                            this.getView().getModel("ui").setProperty("/editModeHdrTo", false);
                        }
    
                        // HU
                        this.byId("btnEditHu").setEnabled(!pEditable);
                        this.byId("btnDeleteHu").setEnabled(!pEditable);
                        this.byId("btnRefreshHu").setEnabled(!pEditable);
                        this.byId("btnFullScreenHu").setEnabled(!pEditable);
                        this.byId("btnTabLayoutHu").setEnabled(!pEditable);
    
                        // Detail
                        this.byId("btnAddDtl").setEnabled(!pEditable);
                        this.byId("btnPickDtl").setEnabled(!pEditable);
                        this.byId("btnDeleteDtl").setEnabled(!pEditable);
                        this.byId("btnRefreshDtl").setEnabled(!pEditable);
                        this.byId("btnFullScreenDtl").setEnabled(!pEditable);
                        this.byId("btnTabLayoutDtl").setEnabled(!pEditable);
    
                        // Shipment
                        this.byId("btnEditShip").setEnabled(!pEditable);
                        this.byId("btnRefreshShip").setEnabled(!pEditable);
                        this.byId("btnFullScreenShip").setEnabled(!pEditable);
                        this.byId("btnTabLayoutShip").setEnabled(!pEditable);
                        
                        // Status
                        this.byId("btnRefreshStat").setEnabled(!pEditable);
                        this.byId("btnFullScreenStat").setEnabled(!pEditable);
                        this.byId("btnTabLayoutStat").setEnabled(!pEditable);
    
                        // Material Document
                        this.byId("btnRefreshMatDoc").setEnabled(!pEditable);
                        this.byId("btnFullScreenMatDoc").setEnabled(!pEditable);
                        this.byId("btnTabLayoutMatDoc").setEnabled(!pEditable);

                        // // Other Info
                        // this.byId("btnAddOthInfo").setEnabled(!pEditable);
                        // this.byId("btnEditOthInfo").setEnabled(!pEditable);
                        // this.byId("btnDeleteOthInfo").setEnabled(!pEditable);
                        // this.byId("btnRefreshOthInfo").setEnabled(!pEditable);

                    } else if (pType == "hu") {
                        _this.byId("btnEditHu").setVisible(!pEditable);
                        _this.byId("btnDeleteHu").setVisible(!pEditable);
                        _this.byId("btnRefreshHu").setVisible(!pEditable);
                        _this.byId("btnSaveHu").setVisible(pEditable);
                        _this.byId("btnCancelHu").setVisible(pEditable);
                        _this.byId("btnTabLayoutHu").setVisible(!pEditable);

                        // Header
                        this.byId("btnEditHdr").setEnabled(!pEditable);
                        this.byId("btnDeleteHdr").setEnabled(!pEditable);
                        this.byId("btnSetStatusHdr").setEnabled(!pEditable);
                        this.byId("btnRefreshHdr").setEnabled(!pEditable);
                        this.byId("btnPrintHdr").setEnabled(!pEditable);
                        this.byId("btnCloseHdr").setEnabled(!pEditable);
                        
                        if (_this.byId("btnEditHu").getVisible() == false) {
                            _this.byId("btnFullScreenHu").setVisible(false);
                            _this.byId("btnExitFullScreenHu").setVisible(false);
                        } else {
                            if (_this.byId("frmHeader").getVisible()) {
                                _this.byId("btnFullScreenHu").setVisible(true);
                                _this.byId("btnExitFullScreenHu").setVisible(false);
                            } else {
                                _this.byId("btnFullScreenHu").setVisible(false);
                                _this.byId("btnExitFullScreenHu").setVisible(true);
                            }
                        }
                    } else if (pType == "ship") {
                        _this.byId("btnEditShip").setVisible(!pEditable);
                        _this.byId("btnRefreshShip").setVisible(!pEditable);
                        _this.byId("btnSaveShip").setVisible(pEditable);
                        _this.byId("btnCancelShip").setVisible(pEditable);
                        _this.byId("btnFullScreenShip").setVisible(!pEditable);
                        _this.byId("btnTabLayoutShip").setVisible(!pEditable);

                        // Header
                        this.byId("btnEditHdr").setEnabled(!pEditable);
                        this.byId("btnDeleteHdr").setEnabled(!pEditable);
                        this.byId("btnSetStatusHdr").setEnabled(!pEditable);
                        this.byId("btnRefreshHdr").setEnabled(!pEditable);
                        this.byId("btnPrintHdr").setEnabled(!pEditable);
                        this.byId("btnCloseHdr").setEnabled(!pEditable);

                        if (_this.byId("btnEditShip").getVisible() == false) {
                            _this.byId("btnFullScreenShip").setVisible(false);
                            _this.byId("btnExitFullScreenShip").setVisible(false);
                        } else {
                            if (_this.byId("frmHeader").getVisible()) {
                                _this.byId("btnFullScreenShip").setVisible(true);
                                _this.byId("btnExitFullScreenShip").setVisible(false);
                            } else {
                                _this.byId("btnFullScreenShip").setVisible(false);
                                _this.byId("btnExitFullScreenShip").setVisible(true);
                            }
                        }
                    } 
                    // else if (pType == "othInfo") {
                    //     if (pAdd == true) {
                    //         this.byId("btnAddOthInfo").setVisible(!pAdd);
                    //         this.byId("btnEditOthInfo").setVisible(!pAdd);
                    //         this.byId("btnAddRowOthInfo").setVisible(pAdd);
                    //         this.byId("btnRemoveRowOthInfo").setVisible(pAdd);
                    //         this.byId("btnSaveOthInfo").setVisible(pAdd);
                    //         this.byId("btnCancelOthInfo").setVisible(pAdd);
                    //         this.byId("btnDeleteOthInfo").setVisible(!pAdd);
                    //         this.byId("btnRefreshOthInfo").setVisible(!pAdd);
                    //     } else {
                    //         this.byId("btnAddOthInfo").setVisible(!pEditable);
                    //         this.byId("btnEditOthInfo").setVisible(!pEditable);
                    //         this.byId("btnAddRowOthInfo").setVisible(pEditable);
                    //         this.byId("btnRemoveRowOthInfo").setVisible(pEditable);
                    //         this.byId("btnSaveOthInfo").setVisible(pEditable);
                    //         this.byId("btnCancelOthInfo").setVisible(pEditable);
                    //         this.byId("btnDeleteOthInfo").setVisible(!pEditable);
                    //         this.byId("btnRefreshOthInfo").setVisible(!pEditable);
                    //     }
                    // }

                    // Icon Tab Bar
                    var oIconTabBar = this.byId("itbDetails");
                    if (pEditable) {
                        oIconTabBar.getItems().filter(item => item.getProperty("key") !== oIconTabBar.getSelectedKey())
                            .forEach(item => item.setProperty("enabled", false));
                    } else {
                        oIconTabBar.getItems().forEach(item => item.setProperty("enabled", true));
                    }
                }
            },

            setControlAppAction(pChange) {
                // Header
                this.byId("btnEditHdr").setVisible(pChange);
                this.byId("btnDeleteHdr").setVisible(pChange);
                this.byId("btnSetStatusHdr").setVisible(pChange);
                this.byId("btnRefreshHdr").setVisible(true);
                this.byId("btnPrintHdr").setVisible(true);
                this.byId("btnCloseHdr").setVisible(true);
                this.byId("btnSaveHdr").setVisible(false);
                this.byId("btnCancelHdr").setVisible(false);

                // HU
                this.byId("btnEditHu").setVisible(pChange);
                this.byId("btnDeleteHu").setVisible(pChange);
                this.byId("btnRefreshHu").setVisible(true);
                this.byId("btnFullScreenHu").setVisible(true);
                this.byId("btnTabLayoutHu").setVisible(true);

                // Detail
                this.byId("btnAddDtl").setVisible(pChange);
                this.byId("btnPickDtl").setVisible(pChange);
                this.byId("btnDeleteDtl").setVisible(pChange);
                this.byId("btnRefreshDtl").setVisible(true);
                this.byId("btnFullScreenDtl").setVisible(true);
                this.byId("btnTabLayoutDtl").setVisible(true);

                // Shipment
                this.byId("btnEditShip").setVisible(pChange);
                this.byId("btnRefreshShip").setVisible(true);
                this.byId("btnFullScreenShip").setVisible(true);
                this.byId("btnTabLayoutShip").setVisible(true);

                // Status
                this.byId("btnRefreshStat").setVisible(true);
                this.byId("btnFullScreenStat").setVisible(true);
                this.byId("btnTabLayoutStat").setVisible(true);

                // Material Document
                this.byId("btnRefreshMatDoc").setVisible(true);
                this.byId("btnFullScreenMatDoc").setVisible(true);
                this.byId("btnTabLayoutMatDoc").setVisible(true);
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
                if (oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") {
                    var sRowId = "";

                    if (oEvent.srcControl.sParentAggregationName == "rows") sRowId = oEvent.srcControl.sId;
                    else if (oEvent.srcControl.sParentAggregationName == "cells") sRowId = oEvent.srcControl.oParent.sId;

                    var oTable = this.byId(sRowId).oParent;
                    var sModel = "";
                    if (oTable.getId().indexOf("huTab") >= 0) sModel = "hu";
                    else if (oTable.getId().indexOf("dtlTab") >= 0) sModel = "dtl";
                    else if (oTable.getId().indexOf("shipTab") >= 0) sModel = "ship";
                    else if (oTable.getId().indexOf("statTab") >= 0) sModel = "stat";
                    else if (oTable.getId().indexOf("matDocTab") >= 0) sModel = "matDoc";

                    if (this.byId(sRowId).getBindingContext(sModel)) {
                        var sRowPath = this.byId(sRowId).getBindingContext(sModel).sPath;

                        oTable.getModel(sModel).getData().results.forEach(row => row.ACTIVE = "");
                        oTable.getModel(sModel).setProperty(sRowPath + "/ACTIVE", "X");

                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext(sModel) && row.getBindingContext(sModel).sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })

                        if (sModel == "hu" && oEvent.ctrlKey == true) {
                            _this.setActiveRowFocus("hu");
                        }
                    }
                } 
                
                // if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                //     var oTable = this.byId(oEvent.srcControl.sId).oParent;

                //     var sModel = "";
                //     if (oTable.getId().indexOf("huTab") >= 0) sModel = "hu";
                //     else if (oTable.getId().indexOf("dtlTab") >= 0) sModel = "dtl";
                //     else if (oTable.getId().indexOf("shipTab") >= 0) sModel = "ship";
                //     else if (oTable.getId().indexOf("statTab") >= 0) sModel = "stat";
                //     else if (oTable.getId().indexOf("matDocTab") >= 0) sModel = "matDoc";

                //     if (this.byId(oEvent.srcControl.sId).getBindingContext(sModel)) {
                //         var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext(sModel).sPath;

                //         oTable.getModel(sModel).getData().results.forEach(row => row.ACTIVE = "");
                //         oTable.getModel(sModel).setProperty(sRowPath + "/ACTIVE", "X");

                //         oTable.getRows().forEach(row => {
                //             if (row.getBindingContext(sModel) && row.getBindingContext(sModel).sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                //                 row.addStyleClass("activeRow");
                //             }
                //             else row.removeStyleClass("activeRow")
                //         })
                //     }
                // } 
            },

            onFormValueHelpInputChange(oEvent) {
                var oSource = oEvent.getSource();
                var sId = oSource.getId();
                var sKey = oSource.mProperties.selectedKey;

                if (sId.includes("iptToMethod")) {
                    //this.getResources("SLocSet", "issSloc", "PLANTCD eq '" + sKey + "'");
                }
            },

            onTableResize(pGroup, pType) {
                if (pGroup === "hdr") {

                }
                else if (pGroup === "dtl") {
                    if (pType === "Max") {
                        this.byId("btnFullScreenDtl").setVisible(false);
                        this.byId("btnFullScreenHu").setVisible(false);
                        this.byId("btnFullScreenShip").setVisible(false);
                        this.byId("btnFullScreenStat").setVisible(false);
                        this.byId("btnFullScreenMatDoc").setVisible(false);
    
                        this.byId("btnExitFullScreenDtl").setVisible(true);
                        this.byId("btnExitFullScreenHu").setVisible(true);
                        this.byId("btnExitFullScreenShip").setVisible(true);
                        this.byId("btnExitFullScreenStat").setVisible(true);
                        this.byId("btnExitFullScreenMatDoc").setVisible(true);
    
                        this.getView().byId("tbHeader").setVisible(false);
                        this.getView().byId("frmHeader").setVisible(false);
                        this.getView().byId("itbDetails").setVisible(true);
                    }
                    else {
                        this.byId("btnFullScreenDtl").setVisible(true);
                        this.byId("btnFullScreenHu").setVisible(true);
                        this.byId("btnFullScreenShip").setVisible(true);
                        this.byId("btnFullScreenStat").setVisible(true);
                        this.byId("btnFullScreenMatDoc").setVisible(true);
    
                        this.byId("btnExitFullScreenDtl").setVisible(false);
                        this.byId("btnExitFullScreenHu").setVisible(false);
                        this.byId("btnExitFullScreenShip").setVisible(false);
                        this.byId("btnExitFullScreenStat").setVisible(false);
                        this.byId("btnExitFullScreenMatDoc").setVisible(false);
    
                        this.getView().byId("tbHeader").setVisible(true);
                        this.getView().byId("frmHeader").setVisible(true);
                        this.getView().byId("itbDetails").setVisible(true);
                    }
                }
            },

            onSaveTableLayout: function (oEvent) {
                var ctr = 1;
                var oTable = oEvent.getSource().oParent.oParent;
                var oColumns = oTable.getColumns();
                var sSBU = _this.getView().getModel("ui").getData().sbu;

                var oParam = {
                    "SBU": sSBU,
                    "TYPE": "",
                    "TABNAME": "",
                    "TableLayoutToItems": []
                };

                _aTableProp.forEach(item => {
                    if (item.tblModel == oTable.getBindingInfo("rows").model) {
                        oParam['TYPE'] = item.modCode;
                        oParam['TABNAME'] = item.tblSrc;
                    }
                });

                oColumns.forEach((column) => {
                    oParam.TableLayoutToItems.push({
                        COLUMNNAME: column.mProperties.sortProperty,
                        ORDER: ctr.toString(),
                        SORTED: column.mProperties.sorted,
                        SORTORDER: column.mProperties.sortOrder,
                        SORTSEQ: "1",
                        VISIBLE: column.mProperties.visible,
                        WIDTH: column.mProperties.width.replace('px','')
                    });

                    ctr++;
                });

                var oModel = _this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");
                oModel.create("/TableLayoutSet", oParam, {
                    method: "POST",
                    success: function(data, oResponse) {
                        MessageBox.information(_oCaption.INFO_LAYOUT_SAVE);
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });                
            },

            getCaption() {
                var oJSONModel = new JSONModel();
                var oCaptionParam = [];
                var oCaptionResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                // Form
                oCaptionParam.push({CODE: "DLVNO"});
                oCaptionParam.push({CODE: "MVTTYPE"});
                oCaptionParam.push({CODE: "TOMETHOD"});
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

                oCaptionParam.push({CODE: "STATUS"});
                oCaptionParam.push({CODE: "CREATEDBY"});
                oCaptionParam.push({CODE: "CREATEDDT"});
                oCaptionParam.push({CODE: "UPDATEDBY"});
                oCaptionParam.push({CODE: "UPDATEDDT"});
                oCaptionParam.push({CODE: "DELETED"});

                // Button
                oCaptionParam.push({CODE: "PICK_COMPLETE"});
                oCaptionParam.push({CODE: "POST"});
                oCaptionParam.push({CODE: "UNDO_PICK_COMPLETE"});
                oCaptionParam.push({CODE: "REVERSE"});
                oCaptionParam.push({CODE: "ADD"});
                oCaptionParam.push({CODE: "EDIT"});
                oCaptionParam.push({CODE: "DELETE"});
                oCaptionParam.push({CODE: "REFRESH"});
                oCaptionParam.push({CODE: "SAVE"});
                oCaptionParam.push({CODE: "CANCEL"});
                oCaptionParam.push({CODE: "PRINT"});
                oCaptionParam.push({CODE: "CLOSE"});
                oCaptionParam.push({CODE: "SETSTATUS"});
                oCaptionParam.push({CODE: "FORPICK"});
                oCaptionParam.push({CODE: "PICK"});
                oCaptionParam.push({CODE: "AUTOPICK"});
                oCaptionParam.push({CODE: "MANUALPICK"});
                oCaptionParam.push({CODE: "FULLSCREEN"});
                oCaptionParam.push({CODE: "EXITFULLSCREEN"});
                oCaptionParam.push({CODE: "SAVELAYOUT"});

                // Label
                oCaptionParam.push({CODE: "ITEM(S)"});

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
                oCaptionParam.push({CODE: "WARN_PICK_NOT_ALLOW"});
                oCaptionParam.push({CODE: "INFO_NO_DATA_EDIT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_EXECUTE"});
                oCaptionParam.push({CODE: "INFO_EXECUTE_SUCCESS"});
                oCaptionParam.push({CODE: "WARN_STATUS_POSTED_REVERSE"});
                oCaptionParam.push({CODE: "INFO_OD_POSTED"});
                oCaptionParam.push({CODE: "INFO_OD_PICKED"});
                oCaptionParam.push({CODE: "CONFIRM_OD_POST"});
                oCaptionParam.push({CODE: "CONFIRM_OD_PICK"});
                oCaptionParam.push({CODE: "CONFIRM_OD_FORPICK"});
                oCaptionParam.push({CODE: "INFO_SEL_RECORD"});
                oCaptionParam.push({CODE: "INFO_ALREADY_DELETED"});
                oCaptionParam.push({CODE: "INFO_NO_BALANCE"});
                oCaptionParam.push({CODE: "WARN_NO_DATA_MODIFIED"});
                oCaptionParam.push({CODE: "INFO_IS_ALREADY_DELETED"});
                oCaptionParam.push({CODE: "INFO_LAYOUT_SAVE"});
                oCaptionParam.push({CODE: "CONFIRM_AUTO_PICK"});
                oCaptionParam.push({CODE: "INFO_IS_NOT_VALID"});
                oCaptionParam.push({CODE: "INFO_NO_VALID_DLVHU"});
                oCaptionParam.push({CODE: "INFO_OD_FORPICK_COMPLETE"});
                
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