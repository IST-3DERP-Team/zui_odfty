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

        return BaseController.extend("zuiodfty.controller.Reservation", {
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
                    editModeHeader: false
                }), "ui");

                _this.initializeComponent();
            },

            initializeComponent() {
                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

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

            onAddDtl() {
                _this._router.navTo("RoutePicking", {
                    sbu: _this.getView().getModel("ui").getData().sbu,
                    dlvNo: "empty"
                });
            },

            setHeaderValue() {
                var oHeader = _this.getView().getModel("hdr").getData().results[0];

                _this.byId("iptDlvNo").setValue(oHeader.DLVNO);
                _this.byId("iptMvtType").setValue(oHeader.MVTTYPE);
                _this.byId("iptStatus").setValue(oHeader.STATUS);
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

            onKeyUp(oEvent) {
                if ((oEvent.key === "ArrowUp" || oEvent.key === "ArrowDown") && oEvent.srcControl.sParentAggregationName === "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    // if (this.byId(oEvent.srcControl.sId).getBindingContext("rsv")) {
                    //     var sRowPath = this.byId(oEvent.srcControl.sId).getBindingContext("rsv").sPath;
                        
                    //     oTable.getModel("rsv").getData().results.forEach(row => row.ACTIVE = "");
                    //     oTable.getModel("rsv").setProperty(sRowPath + "/ACTIVE", "X"); 
                        
                    //     oTable.getRows().forEach(row => {
                    //         if (row.getBindingContext("rsv") && row.getBindingContext("rsv").sPath.replace("/results/", "") === sRowPath.replace("/results/", "")) {
                    //             row.addStyleClass("activeRow");
                    //         }
                    //         else row.removeStyleClass("activeRow")
                    //     })
                    // }
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

                // MessageBox
                oCaptionParam.push({CODE: "INFO_NO_RECORD_SELECT"});
                oCaptionParam.push({CODE: "CONFIRM_PROCEED_CLOSE"});
                
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