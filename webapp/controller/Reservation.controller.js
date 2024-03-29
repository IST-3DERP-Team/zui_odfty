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
	'sap/m/SearchField',
    'sap/ui/core/routing/History'
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, MessageBox, Filter, FilterOperator, Sorter, Device, library, TablePersoController, MessageToast, SearchField, History) {
        "use strict";

        var _this;
        var _oCaption = {};
        var _aSmartFilter;
        var _sSmartFilterGlobal;
        var _startUpInfo = {};
        var _aTableProp = [];

        return BaseController.extend("zuiodfty.controller.Reservation", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_ODFTY_RSV_FILTER_CDS");
                var oSmartFilter = this.getView().byId("sfbODFtyRsv");
                oSmartFilter.setModel(oModel);

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();
                this._router.getRoute("RouteReservation").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvNo: oEvent.getParameter("arguments").dlvNo,
                    dlvType: oEvent.getParameter("arguments").dlvType,
                    mvtType: oEvent.getParameter("arguments").mvtType,
                    srcTbl: oEvent.getParameter("arguments").srcTbl,
                    varCd: (oEvent.getParameter("arguments").varCd == "empty" ? "" : oEvent.getParameter("arguments").varCd),
                    noRangeCd: oEvent.getParameter("arguments").noRangeCd,
                    rsvList: oEvent.getParameter("arguments").rsvList,
                    dtlMaxCount: oEvent.getParameter("arguments").dtlMaxCount,
                    dlvNoInit: oEvent.getParameter("arguments").dlvNo,
                    rowCountRsv: 0
                }), "ui");

                var oSmartFilter = this.getView().byId("sfbODFtyRsv");
                oSmartFilter.clear();

                _this.initializeComponent();

                if (sap.ui.getCore().byId("backBtn")) {
                    sap.ui.getCore().byId("backBtn").mEventRegistry.press[0].fFunction = function(oEvent) {
                        _this.onNavBack();
                    }
                }
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

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
                    modCode: "ODFTYRSVMOD",
                    tblSrc: "ZDV_ODF_RSV",
                    tblId: "rsvTab",
                    tblModel: "rsv"
                });

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

                _this.byId("rsvTab").addEventDelegate(oTableEventDelegate);
                _this.clearSortFilter("rsvTab");

                setTimeout(() => {
                    _this.getRsv([], "");
                }, 300);

                _this.byId("sfSearch").setValue("");

                // var oModel = _this.getOwnerComponent().getModel("ZVB_3DERP_ODFTY_RSV_FILTER_CDS");
                // var oSmartFilter = _this.getView().byId("sfbODFtyRsv");
                // console.log("sfbODFtyRsv", oModel, oSmartFilter)
                // oSmartFilter.setModel(oModel);            
                
                _this._sActiveTable = "rsvTab";
                _this.closeLoadingDialog();
            },

            onSearch(oEvent) {
                this.showLoadingDialog("Loading...");

                var aSmartFilter = this.getView().byId("sfbODFtyRsv").getFilters();
                var sSmartFilterGlobal = "";
                if (oEvent) sSmartFilterGlobal = oEvent.getSource()._oBasicSearchField.mProperties.value;
                
                _aSmartFilter = aSmartFilter;
                _sSmartFilterGlobal = sSmartFilterGlobal;

                _this.getRsv(aSmartFilter, sSmartFilterGlobal);
            },

            onAfterTableRender(pTableId, pTableProps) {
                if (pTableId == "rsvTab") {
                    
                }
            },

            getRsv(pFilters, pFilterGlobal) {
                _this.showLoadingDialog("Loading...");

                var oTable = _this.getView().byId("rsvTab");
                var oModel = _this.getOwnerComponent().getModel();
                var oDataUI = _this.getView().getModel("ui").getData();
                var sMvtType = oDataUI.mvtType;
                var sSrcTbl = oDataUI.srcTbl;
                var sVarCd = oDataUI.varCd;
                var sDlvNo = (oDataUI.dlvNo == "empty" ? "" : oDataUI.dlvNo);
                
                var sFilter = "MVTTYPE eq '" + sMvtType + "' and SRCTBL eq '" + sSrcTbl + 
                    "' and VARCD eq '" + sVarCd + "' and DLVNO eq '" + sDlvNo + "'";    
                console.log("sFilter", sFilter)
                oModel.read('/ReservationSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("ReservationSet", data)

                        if (oDataUI.rsvList != "empty") {
                            var aRsvList = oDataUI.rsvList.split("|");
                            aRsvList.forEach(item => {
                                var iIdx = data.results.findIndex(x => x.RSVNO + x.RSVITEM == item);
                                if (iIdx > -1) {
                                    data.results.splice(iIdx, 1);
                                }
                            })
                        }

                        data.results.forEach((item, idx) => {
                            item.REQDT = _this.formatDatePH(item.REQDT);

                            if (idx == 0) item.ACTIVE = "X";
                            else item.ACTIVE = "";
                        })

                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "rsv");
                        _this._tableRendered = "rsvTab";

                        //_this.onFilterByCol("rsv", aFilterTab);
                        _this.onFilterBySmart("rsv", pFilters, pFilterGlobal, aFilterTab);

                        _this.setRowReadMode("rsv");

                        // Set row count
                        _this.getView().getModel("ui").setProperty("/rowCountRsv", data.results.length);

                        oTable.getColumns().forEach((col, idx) => {   
                            if (col._oSorter) {
                                oTable.sort(col, col.mProperties.sortOrder === "Ascending" ? SortOrder.Ascending : SortOrder.Descending, true);
                            }
                        });
                        
                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onAdd() {
                _this.showLoadingDialog("Loading...");

                var oTable = this.byId("rsvTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
                    _this.closeLoadingDialog();
                    MessageBox.information(_oCaption.INFO_NO_RECORD_SELECT);
                    return;
                }

                var aOrigSelIdx = [];
                aSelIdx.forEach(i => {
                    aOrigSelIdx.push(oTable.getBinding("rows").aIndices[i]);
                })

                var aData = _this.getView().getModel("rsv").getData().results;
                var aDataSel = [];
                var aPlant = [];
                var aSloc = [];
                var isError = false;
                aOrigSelIdx.forEach(i => {
                    var oData = aData[i];
                    aDataSel.push(oData);

                    if (!aPlant.includes(oData.ISSPLANT)) aPlant.push(oData.ISSPLANT);
                    if (!aSloc.includes(oData.ISSSLOC)) aSloc.push(oData.ISSSLOC);
                    if (aPlant.length > 1 || aSloc.length > 1) isError = true;
                });

                if (isError) {
                    _this.closeLoadingDialog();
                    MessageBox.warning(_oCaption.ISSPLANT + " and " + _oCaption.ISSSLOC + " " + _oCaption.INFO_SHOULD_BE_UNIQUE);
                    return;
                }

                if (_this.getView().getModel("ui").getData().dlvNo == "empty") {

                    var oModelRFC = _this.getOwnerComponent().getModel("ZGW_3DERP_RFC_SRV");
                    var oParamGetNumber = {};
    
                    oParamGetNumber["N_GetNumberParam"] = [{
                        IUserid: _startUpInfo.id,
                        INorangecd: _this.getView().getModel("ui").getProperty("/noRangeCd"),
                        IKeycd: ""
                    }];
                    oParamGetNumber["N_GetNumberReturn"] = [];
    
                    oModelRFC.create("/GetNumberSet", oParamGetNumber, {
                        method: "POST",
                        success: function(oResult, oResponse) {
                            console.log("GetNumberSet", oResult, oResponse);
    
                            if (oResult.EReturnno.length > 0) {
                                _this.getView().getModel("ui").setProperty("/dlvNo", oResult.EReturnno);
                                _this.onPopulateDlvHdr(aDataSel);
                                
                            } else {
                                var sMessage = oResult.N_GetNumberReturn.results[0].Type + ' - ' + oResult.N_GetNumberReturn.results[0].Message;
                                sap.m.MessageBox.error(sMessage);
                            }
                        },
                        error: function(err) {
                            sap.m.MessageBox.error(_oCaption.INFO_EXECUTE_FAIL);
                            _this.closeLoadingDialog();
                        }
                    });

                } else {
                    _this.onPopulateDlvDtl(aDataSel);
                }
            },

            onPopulateDlvHdr(pData) {
                var oModel = this.getOwnerComponent().getModel();
                var oDataUI = _this.getView().getModel("ui").getData();
                var sCurrentDate = _this.formatDate(new Date());

                var param = {
                    DLVNO: oDataUI.dlvNo,
                    DLVTYP: oDataUI.dlvType,
                    PLANDLVDT: sCurrentDate + "T00:00:00",
                    ISSPLNT: pData[0].ISSPLANT,
                    ISSSLOC: pData[0].ISSSLOC,
                    RCVPLNT: pData[0].RCVPLANT,
                    RCVSLOC: pData[0].RCVSLOC,
                    POSTDT: sCurrentDate + "T00:00:00",
                    DOCDT: sCurrentDate + "T00:00:00",
                    BWART: oDataUI.mvtType,
                    VARCD: oDataUI.varCd
                };
                
                console.log("InfoHeaderTblSet param", param);
                oModel.create("/InfoHeaderTblSet", param, {
                    method: "POST",
                    success: function(data, oResponse) {
                        console.log("InfoHeaderTblSet create", data);
                        _this.onPopulateDlvDtl(pData);
                    },
                    error: function(err) {
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                });
            },

            onPopulateDlvDtl(pData) {
                var oModel = this.getOwnerComponent().getModel();
                var oDataUI = _this.getView().getModel("ui").getData();

                pData.forEach((item, iIdx) => {
                    var paramDet = {
                        DLVNO: oDataUI.dlvNo,
                        DLVITEM: (parseInt(oDataUI.dtlMaxCount) + iIdx + 1).toString(),
                        PLANTCD: item.ISSPLANT,
                        SLOC: item.ISSSLOC,
                        MATNO: item.ISSMATNO,
                        BATCH: item.ISSBATCH,
                        DLVQTYORD: item.REQQTY,
                        DLVQTYBSE: item.REQQTY,
                        ORDUOM: item.UOM,
                        BASEUOM: item.UOM,
                        RSVNO: item.RSVNO,
                        RSNUM: item.RSVNO,
                        RSPOS: item.RSVITEM,
                        COSTCTR: item.KOSTL
                    };

                    setTimeout(() => {

                        console.log("InfoDetailTblSet param", paramDet);
                        oModel.create("/InfoDetailTblSet", paramDet, {
                            method: "POST",
                            success: function(data, oResponse) {
                                console.log("InfoDetailTblSet create", data)
                                //MessageBox.information(_oCaption.INFO_SAVE_SUCCESS);

                                // _this._router.navTo("RouteDeliveryInfo", {
                                //     sbu: _this.getView().getModel("ui").getData().sbu,
                                //     dlvNo: _this.getView().getModel("ui").getData().dlvNo
                                // });

                                if (iIdx == pData.length - 1) {
                                    if (oDataUI.dlvNoInit == "empty") _this.onLockDlv();
                                    else {
                                        _this.closeLoadingDialog();
                                        _this._router.navTo("RouteDeliveryInfo", {
                                            sbu: oDataUI.sbu,
                                            dlvNo: oDataUI.dlvNo
                                        });
                                    }
                                }
                            },
                            error: function(err) {
                                console.log("error", err)
                                _this.closeLoadingDialog();
                            }
                        });
                    }, 200);
                })
            },

            onLockDlv() {
                var oModelLock = _this.getOwnerComponent().getModel("ZGW_3DERP_LOCK_SRV");
                var sDlvNo = _this.getView().getModel("ui").getData().dlvNo;

                var oParamLock = {
                    Dlvno: sDlvNo,
                    Lock_Unlock_Ind: "X",
                    N_LOCK_UNLOCK_DLVHDR_RET: [],
                    N_LOCK_UNLOCK_DLVHDR_MSG: []
                }

                oModelLock.create("/Lock_Unlock_DlvHdrSet", oParamLock, {
                    method: "POST",
                    success: function(data, oResponse) {
                        console.log("Lock_Unlock_DlvHdrSet", data);
                        _this.closeLoadingDialog();

                        if (data.N_LOCK_UNLOCK_DLVHDR_MSG.results.filter(x => x.Type != "S").length == 0) {
                            _this._router.navTo("RouteDeliveryInfo", {
                                sbu: _this.getView().getModel("ui").getData().sbu,
                                dlvNo: sDlvNo
                            });
                        } else {
                            var oFilter = data.N_LOCK_UNLOCK_DLVHDR_MSG.results.filter(x => x.Type != "S")[0];
                            MessageBox.warning(oFilter.Message);
                        }
                    },
                    error: function(err) {
                        MessageBox.error(err);
                        _this.closeLoadingDialog();
                    }
                });   
            },

            onCancel() {
                MessageBox.confirm(_oCaption.CONFIRM_EXIT_PAGE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this.onNavBack();
                        }
                    }
                });
            },

            onAddHK() {
                if (_this.getView().getModel("base").getData().dataMode == "READ") {
                    if (this._sActiveTable === "rsvTab") this.onAdd();
                }
            },

            onNavBack() {
                var oHistory = History.getInstance();
			    var sPreviousHash = oHistory.getPreviousHash();

                if (sPreviousHash !== undefined) {
                    window.history.go(-1);
                } else {
                    _this._router.navTo("RouteMain", {}, true);
                }
            },

            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    if (this.byId(oEvent.srcControl.sId).getBindingContext("rsv")) {
                        var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext("rsv").sPath;
                        
                        oTable.getModel("rsv").getData().results.forEach(row => row.ACTIVE = "");
                        oTable.getModel("rsv").setProperty(sRowPath + "/ACTIVE", "X"); 
                        
                        oTable.getRows().forEach(row => {
                            if (row.getBindingContext("rsv") && row.getBindingContext("rsv").sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                                row.addStyleClass("activeRow");
                            }
                            else row.removeStyleClass("activeRow")
                        })
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

                // Label
                oCaptionParam.push({CODE: "ISSPLANT"});
                oCaptionParam.push({CODE: "ISSSLOC"});
                oCaptionParam.push({CODE: "ITEM(S)"});

                // Button
                oCaptionParam.push({CODE: "ADD"});
                oCaptionParam.push({CODE: "CANCEL"});
                oCaptionParam.push({CODE: "CLOSE"});
                oCaptionParam.push({CODE: "SAVELAYOUT"});

                // Smart Filter
                oCaptionParam.push({CODE: "RSVNO"});
                oCaptionParam.push({CODE: "ISSSLOC"});
                oCaptionParam.push({CODE: "ISSMATNO"});

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                oCaptionParam.push({CODE: "INFO_SHOULD_BE_SAME"});
                oCaptionParam.push({CODE: "INFO_SHOULD_BE_UNIQUE"});
                oCaptionParam.push({CODE: "INFO_LAYOUT_SAVE"});
                oCaptionParam.push({CODE: "CONFIRM_EXIT_PAGE"});
                
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