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
                    sloc: ""
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

                _this.getPickHdr();

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId, pTableProps) {
            },

            getPickHdr() {
                _this.showLoadingDialog("Loading...");

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

            onAddPickHdr() {
                // var oDataUI = _this.getView().getModel("ui").getData();
                // var oDataHdr = _this.getView().getModel("pickHdr").getData().results.filter(x => x.ISSPLANT == oData.plantCd &&
                //     x.ISSMATNO == oDataUI.matNo && x.ISSBATCH == oDataUI.batch && x.ISSSLOC == oDataUI.sloc)[0];
                // var iBalance = parseFloat(oDataHdr.BALANCE);

                // _this.getView().getModel("pickDtl").getData().results.forEach(item => {
                //     if (iBalance > 0) {
                //         if (parseFloat(item.QTY) > iBalance) {
                //             item.
                //         }
                //     }
                // })
            },

            getPickDtl() {
                _this.showLoadingDialog("Loading...");

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

                        data.results.forEach((item, idx) => {
                            item.BALANCE = parseFloat(item.QTY) - parseFloat(item.TOQTY)
                        });

                        var oJSONModel = new JSONModel();
                        oJSONModel.setData(data);
                        _this.getView().setModel(oJSONModel, "pickDtl");

                        _this.closeLoadingDialog();
                    },
                    error: function (err) {
                        _this.closeLoadingDialog();
                    }
                })
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