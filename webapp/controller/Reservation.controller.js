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

        return BaseController.extend("zuiodfty.controller.Reservation", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();
                this._router.getRoute("RouteReservation").attachPatternMatched(this._routePatternMatched, this);
            },

            _routePatternMatched: function (oEvent) {
                this.getView().setModel(new JSONModel({
                    sbu: oEvent.getParameter("arguments").sbu,
                    dlvType: oEvent.getParameter("arguments").dlvType,
                    mvtType: oEvent.getParameter("arguments").mvtType,
                    srcTbl: oEvent.getParameter("arguments").srcTbl,
                    noRangeCd: oEvent.getParameter("arguments").noRangeCd,
                    dlvNo: ""
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
                    modCode: "ODFTYRSVMOD",
                    tblSrc: "ZDV_ODF_RSV",
                    tblId: "rsvTab",
                    tblModel: "rsv"
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

                this.byId("rsvTab").addEventDelegate(oTableEventDelegate);

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
                if (pTableId == "rsvTab") {
                    _this.getRsv();
                }
            },

            getRsv() {
                _this.showLoadingDialog("Loading...");

                var oTable = _this.getView().byId("rsvTab");
                var oModel = _this.getOwnerComponent().getModel();
                var sMvtType = _this.getView().getModel("ui").getData().mvtType;
                var sSrcTbl = _this.getView().getModel("ui").getData().srcTbl;
                
                var sFilter = "MVTTYPE eq '" + sMvtType + "' and SRCTBL eq '" + sSrcTbl + "'";
                oModel.read('/ReservationSet', {
                    urlParameters: {
                        "$filter": sFilter
                    },
                    success: function (data, response) {
                        console.log("ReservationSet", data)

                        data.results.forEach(item => {
                            item.REQDT = _this.formatDate(item.REQDT);
                        })

                        var aFilterTab = [];
                        if (oTable.getBinding("rows")) {
                            aFilterTab = oTable.getBinding("rows").aFilters;
                        }

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "rsv");
                        _this._tableRendered = "rsvTab";

                        _this.onFilterByCol("rsv", aFilterTab);

                        _this.setRowReadMode("rsv");

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
                var oTable = this.byId("rsvTab");
                var aSelIdx = oTable.getSelectedIndices();

                if (aSelIdx.length === 0) {
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
                var isError = false;
                aOrigSelIdx.forEach(i => {
                    var oData = aData[i];
                    aDataSel.push(oData);

                    if (!aPlant.includes(oData.ISSPLANT)) aPlant.push(oData.ISSPLANT);
                    if (aPlant.length > 1) isError = true;
                });

                if (isError) {
                    MessageBox.warning(_oCaption.ISSPLANT + " " + _oCaption.INFO_SHOULD_BE_SAME);
                    return;
                }

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
                            _this.onPopulateDlv(aDataSel);
                            
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
            },

            onPopulateDlv(pData) {
                var oModel = this.getOwnerComponent().getModel();
                var oDataUI = _this.getView().getModel("ui").getData();
                var sCurrentDate = _this.formatDate(new Date());

                // Populate Header
                var param = {
                    DLVNO: oDataUI.dlvNo,
                    DLVTYP: oDataUI.dlvType,
                    PLANDLVDT: sCurrentDate + "T00:00:00",
                    ISSPLNT: pData[0].ISSPLANT,
                    RCVPLNT: pData[0].RCVPLANT,
                    RCVSLOC: pData[0].RCVSLOC,
                    POSTDT: sCurrentDate + "T00:00:00",
                    DOCDT: sCurrentDate + "T00:00:00",
                    BWART: oDataUI.mvtType
                };
                
                console.log("InfoHeaderTblSet param", param);
                oModel.create("/InfoHeaderTblSet", param, {
                    method: "POST",
                    success: function(data, oResponse) {
                        console.log("InfoHeaderTblSet create", data);

                        // Populate Details
                        pData.forEach((item, idx) => {
                            var paramDet = {
                                DLVNO: oDataUI.dlvNo,
                                DLVITEM: (idx + 1).toString(),
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
                                RSPOS: item.RSVITEM
                            };

                            console.log("InfoDetailTblSet param", paramDet);
                            oModel.create("/InfoDetailTblSet", paramDet, {
                                method: "POST",
                                success: function(data, oResponse) {
                                    console.log("InfoDetailTblSet create", data)
                                    //MessageBox.information(_oCaption.INFO_SAVE_SUCCESS);

                                    _this._router.navTo("RouteDeliveryInfo", {
                                        sbu: _this.getView().getModel("ui").getData().sbu,
                                        dlvNo: _this.getView().getModel("ui").getData().dlvNo
                                    });
                                },
                                error: function(err) {
                                    console.log("error", err)
                                    _this.closeLoadingDialog();
                                }
                            });
                        })
                    },
                    error: function(err) {
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                });
            },

            onCancel() {
                MessageBox.confirm(_oCaption.CONFIRM_PROCEED_CLOSE, {
                    actions: ["Yes", "No"],
                    onClose: function (sAction) {
                        if (sAction == "Yes") {
                            _this._router.navTo("RouteMain", {}, true);
                        }
                    }
                });
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

            getCaption() {
                var oJSONModel = new JSONModel();
                var oCaptionParam = [];
                var oCaptionResult = {};
                var oModel = this.getOwnerComponent().getModel("ZGW_3DERP_COMMON_SRV");

                // Label
                oCaptionParam.push({CODE: "ISSPLANT"});

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                oCaptionParam.push({CODE: "INFO_SHOULD_BE_SAME"});
                
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