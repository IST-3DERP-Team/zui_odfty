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
        var _aSmartFilter;
        var _sSmartFilterGlobal;

        return BaseController.extend("zuiodfty.controller.Main", {
            onInit: function () {
                _this = this;

                _this.getCaption();

                var oComponent = this.getOwnerComponent();
                this._router = oComponent.getRouter();

                _this.initializeComponent();
            },

            initializeComponent() {
                this.getView().setModel(new JSONModel({
                    sbu: "VER" // temporary Sbu
                }), "ui");

                this.onInitBase(_this, _this.getView().getModel("ui").getData().sbu);
                _this.showLoadingDialog("Loading...");

                var aTableList = [];
                aTableList.push({
                    modCode: "ODFTYHDRMOD",
                    tblSrc: "ZDV_ODF_HDR",
                    tblId: "odFtyHdrTab",
                    tblModel: "odFtyHdr"
                });

                aTableList.push({
                    modCode: "ODFTYDTLMOD",
                    tblSrc: "ZDV_ODF_DTL",
                    tblId: "odFtyDtlTab",
                    tblModel: "odFtyDtl"
                });

                _this.getColumns(aTableList);

                var oModel = this.getOwnerComponent().getModel("ZVB_3DERP_ODFTY_FILTER_CDS");
                var oSmartFilter = this.getView().byId("sfbODFty");
                oSmartFilter.setModel(oModel);

                // Header button
                this.byId("btnAddODFtyHdr").setEnabled(false);
                this.byId("btnEditODFtyHdr").setEnabled(false);
                this.byId("btnRefreshODFtyHdr").setEnabled(false);

                // Detail button
                this.byId("btnRefreshODFtyDtl").setEnabled(false);

                this._tableRendered = "";
                var oTableEventDelegate = {
                    onkeyup: function(oEvent){
                        _this.onKeyUp(oEvent);
                    },

                    onAfterRendering: function(oEvent) {
                        _this.onAfterTableRendering(oEvent);
                    }
                };

                this.byId("odFtyHdrTab").addEventDelegate(oTableEventDelegate);
                this.byId("odFtyDtlTab").addEventDelegate(oTableEventDelegate);

                _this.closeLoadingDialog();
            },

            onAfterTableRender(pTableId) {
                //console.log("onAfterTableRendering", pTableId)
            },

            onSearch(oEvent) {
                this.showLoadingDialog("Loading...");

                var aSmartFilter = this.getView().byId("sfbODFty").getFilters();
                var sSmartFilterGlobal = "";
                if (oEvent) sSmartFilterGlobal = oEvent.getSource()._oBasicSearchField.mProperties.value;
                
                _aSmartFilter = aSmartFilter;
                _sSmartFilterGlobal = sSmartFilterGlobal;

                this.getHeader(aSmartFilter, sSmartFilterGlobal);

                // Header button
                this.byId("btnAddODFtyHdr").setEnabled(true);
                this.byId("btnEditODFtyHdr").setEnabled(true);
                this.byId("btnRefreshODFtyHdr").setEnabled(true);

                // Detail button
                this.byId("btnRefreshODFtyDtl").setEnabled(true);
            },

            getHeader(pFilters, pFilterGlobal) {
                _this.showLoadingDialog("Loading...");

                var oModel = this.getOwnerComponent().getModel();
                var oTable = _this.getView().byId("odFtyHdrTab");

                oModel.read('/HeaderSet', {
                    success: function (data, response) {
                        console.log("HeaderSet", data)
                        if (data.results.length > 0) {

                            data.results.forEach((item, idx) => {
                                if (item.CREATEDDT !== null)
                                    item.CREATEDDT = _this.formatDate(item.CREATEDDT);

                                if (item.PLANDLVDT !== null)
                                    item.PLANDLVDT = _this.formatDate(item.PLANDLVDT);

                                if (item.DOCDT !== null)
                                    item.DOCDT = _this.formatDate(item.DOCDT);

                                if (item.POSTDT !== null)
                                    item.POSTDT = _this.formatDate(item.POSTDT);
                                
                                if (item.REFDOCDT !== null)
                                    item.REFDOCDT = _this.formatDate(item.REFDOCDT);

                                if (item.CREATEDDT !== null)
                                    item.CREATEDDT = _this.formatDate(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                                if (item.UPDATEDDT !== null)
                                    item.UPDATEDDT = _this.formatDate(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);

                                if (idx == 0) item.ACTIVE = "X";
                                else item.ACTIVE = "";
                            })

                            var aFilterTab = [];
                            if (oTable.getBinding("rows")) {
                                aFilterTab = oTable.getBinding("rows").aFilters;
                            }

                            var oJSONModel = new JSONModel();
                            oJSONModel.setData(data);
                            _this.getView().setModel(oJSONModel, "odFtyHdr");
                            _this._tableRendered = "odFtyHdrTab";

                            _this.onFilterBySmart("odFtyHdr", pFilters, pFilterGlobal, aFilterTab);

                            _this.setRowReadMode("odFtyHdr");
                        }

                        oTable.getColumns().forEach((col, idx) => {   
                            if (col._oSorter) {
                                oTable.sort(col, col.mProperties.sortOrder === "Ascending" ? SortOrder.Ascending : SortOrder.Descending, true);
                            }
                        });

                        if (oTable.getBinding("rows").aIndices.length > 0) {
                            var aIndices = oTable.getBinding("rows").aIndices;
                            var sDlvNo = _this.getView().getModel("odFtyHdr").getData().results[aIndices[0]].DLVNO;
                            _this.getView().getModel("ui").setProperty("/dlvNo", sDlvNo);
                            _this.getDetail();
                        } else {
                            _this.getView().getModel("ui").setProperty("/dlvNo", "");
                            _this.getView().getModel("odFtyDtl").setProperty("/results", []);
                        }
                        
                        _this.closeLoadingDialog();
                    },
                    error: function (err) { 
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            getDetail() {
                var oModel = this.getOwnerComponent().getModel();
                var sDlvNo = this.getView().getModel("ui").getData().dlvNo;
                oModel.read('/DetailSet', {
                    urlParameters: {
                        "$filter": "DLVNO eq '" + sDlvNo + "'"
                    },
                    success: function (data, response) {
                        console.log("DetailSet", data)
                        if (data.results.length > 0) {

                            data.results.forEach(item => {
                                if (item.CREATEDDT !== null)
                                    item.CREATEDDT = _this.formatDate(item.CREATEDDT) + " " + _this.formatTime(item.CREATEDTM);

                                if (item.UPDATEDDT !== null)
                                    item.UPDATEDDT = _this.formatDate(item.UPDATEDDT) + " " + _this.formatTime(item.UPDATEDTM);
                            })

                            var aFilterTab = [];
                            if (_this.getView().byId("odFtyDtlTab").getBinding("rows")) {
                                aFilterTab = _this.getView().byId("odFtyDtlTab").getBinding("rows").aFilters;
                            }

                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(data);
                            _this.getView().setModel(oJSONModel, "odFtyDtl");
                            _this._tableRendered = "odFtyDtlTab";

                            if (aFilterTab.length > 0) {
                                aFilterTab.forEach(item => {
                                    var iColIdx = _this._aColumns["odFtyDtl"].findIndex(x => x.name == item.sPath);
                                    _this.getView().byId("odFtyDtl").filter(_this.getView().byId("odFtyDtl").getColumns()[iColIdx], 
                                        item.oValue1);
                                });
                            }

                            _this.setRowReadMode("odFtyDtl");
                        } else {
                            _this.getView().setModel(new JSONModel({
                                results: []
                            }), "odFtyDtl");
                        }

                        var oTable = _this.getView().byId("odFtyDtlTab");
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

            onAddODFtyHdr() {
                var oModel = this.getOwnerComponent().getModel();

                oModel.read('/DlvTypeSet', {
                    success: function (data, response) {
                        if (data.results.length > 0) {
                            console.log("DlvTypeSet", data)

                            var oJSONModel = new sap.ui.model.json.JSONModel();
                            oJSONModel.setData(data);
                            _this.getView().setModel(oJSONModel, "dlvType");


                            _this._DeliveryType = sap.ui.xmlfragment(_this.getView().getId(), "zuiodfty.view.fragments.dialog.DeliveryType", _this);
                            _this._DeliveryType.setModel(oJSONModel);
                            _this.getView().addDependent(_this._DeliveryType);

                            _this._DeliveryType.addStyleClass("sapUiSizeCompact");
                            _this._DeliveryType.open();
                        }

                    },
                    error: function (err) {
                        console.log("error", err)
                        _this.closeLoadingDialog();
                    }
                })
            },

            onProceedDlvtype() {

            },

            onCancelDlvType() {
                _this._DeliveryType.destroy(true);
            },

            onCellClickODFtyHdr(oEvent) {
                var sDlvNo = oEvent.getParameters().rowBindingContext.getObject().DLVNO;
                this.getView().getModel("ui").setProperty("/dlvNo", sDlvNo);

                this.onCellClick(oEvent);

                this.getDetail();

                // Clear Sort and Filter
                this.clearSortFilter("odFtyDtlTab");
            },

            onKeyUp(oEvent) {
                if ((oEvent.key == "ArrowUp" || oEvent.key == "ArrowDown") && oEvent.srcControl.sParentAggregationName == "rows") {
                    var oTable = this.byId(oEvent.srcControl.sId).oParent;

                    var sModel = "";
                    if (oTable.getId().indexOf("odFtyHdrTab") >= 0) sModel = "odFtyHdr";
                    else if (oTable.getId().indexOf("odFtyDtlTab") >= 0) sModel = "odFtyDtl";

                    if (sModel == "odFtyHdr") {
                        var sRowId = this.byId(oEvent.srcControl.sId);
                        var sRowPath = this.byId(oEvent.srcControl.sId).oBindingContexts["odFtyHdr"].sPath;
                        var oRow = this.getView().getModel("odFtyHdr").getProperty(sRowPath);
                        var sDlvNo = oRow.DLVNO;
                        this.getView().getModel("ui").setProperty("/dlvNo", sDlvNo);

                        this.getDetail();
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
                
                // Smart Filter
                oCaptionParam.push({CODE: "SBU"});
                oCaptionParam.push({CODE: "DLVTYPE"});
                oCaptionParam.push({CODE: "DLVNO"});
                oCaptionParam.push({CODE: "ISSPLANT"});
                oCaptionParam.push({CODE: "RCVPLANT"});
                oCaptionParam.push({CODE: "REFDLVNO"});

                // Dialog
                oCaptionParam.push({CODE: "SEL_DLVTYPE"});
                oCaptionParam.push({CODE: "DESCRIP"});
                oCaptionParam.push({CODE: "MVTTYPE"});
                oCaptionParam.push({CODE: "PROCEED"});
                oCaptionParam.push({CODE: "CANCEL"});

                // MessageBox
                
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
