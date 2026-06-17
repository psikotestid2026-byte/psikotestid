"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var serverless_1 = require("@neondatabase/serverless");
var dotenv = __importStar(require("dotenv"));
dotenv.config({ path: '.env.local' });
var sql = (0, serverless_1.neon)(process.env.DATABASE_URL);
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var tests, testMap;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Seeding Master Tests...');
                    return [4 /*yield*/, sql(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n    INSERT INTO master_tests (code, name, price, duration_sec, is_active, instructions)\n    VALUES \n      ('DISC', 'DISC Personality Test', 20000, 600, true, 'Pilih satu pernyataan yang paling menggambarkan diri Anda (Paling) dan satu yang paling tidak menggambarkan diri Anda (Kurang).'),\n      ('WPT', 'Wonderlic Personnel Test', 30000, 720, true, 'Jawablah pertanyaan berikut dengan cepat dan tepat.'),\n      ('PAPI', 'PAPI Kostick', 40000, 900, true, 'Pilih satu dari dua pernyataan yang paling sesuai dengan diri Anda.')\n    ON CONFLICT (code) DO UPDATE SET price = EXCLUDED.price;\n  "], ["\n    INSERT INTO master_tests (code, name, price, duration_sec, is_active, instructions)\n    VALUES \n      ('DISC', 'DISC Personality Test', 20000, 600, true, 'Pilih satu pernyataan yang paling menggambarkan diri Anda (Paling) dan satu yang paling tidak menggambarkan diri Anda (Kurang).'),\n      ('WPT', 'Wonderlic Personnel Test', 30000, 720, true, 'Jawablah pertanyaan berikut dengan cepat dan tepat.'),\n      ('PAPI', 'PAPI Kostick', 40000, 900, true, 'Pilih satu dari dua pernyataan yang paling sesuai dengan diri Anda.')\n    ON CONFLICT (code) DO UPDATE SET price = EXCLUDED.price;\n  "])))];
                case 1:
                    _a.sent();
                    console.log('Seeding Question Banks (DISC & WPT)...');
                    return [4 /*yield*/, sql(templateObject_2 || (templateObject_2 = __makeTemplateObject(["SELECT id, code FROM master_tests"], ["SELECT id, code FROM master_tests"])))];
                case 2:
                    tests = _a.sent();
                    testMap = tests.reduce(function (acc, t) {
                        var _a;
                        return (__assign(__assign({}, acc), (_a = {}, _a[t.code] = t.id, _a)));
                    }, {});
                    if (!testMap['DISC']) return [3 /*break*/, 5];
                    return [4 /*yield*/, sql(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      INSERT INTO question_banks (test_id, order_number, question_type, question_data)\n      VALUES \n        (", ", 1, 'disc', '{\"items\": [\"Mudah bergaul, ramah\", \"Mempercayai orang lain\", \"Petualang, pengambil resiko\", \"Penuh toleransi\"]}'::jsonb),\n        (", ", 2, 'disc', '{\"items\": [\"Yang penting hasil\", \"Kerjakan dengan benar\", \"Buat menyenangkan\", \"Kerjakan bersama\"]}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "], ["\n      INSERT INTO question_banks (test_id, order_number, question_type, question_data)\n      VALUES \n        (", ", 1, 'disc', '{\"items\": [\"Mudah bergaul, ramah\", \"Mempercayai orang lain\", \"Petualang, pengambil resiko\", \"Penuh toleransi\"]}'::jsonb),\n        (", ", 2, 'disc', '{\"items\": [\"Yang penting hasil\", \"Kerjakan dengan benar\", \"Buat menyenangkan\", \"Kerjakan bersama\"]}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "])), testMap['DISC'], testMap['DISC'])];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, sql(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n      INSERT INTO scoring_configs (test_id, formula_type, config_data)\n      VALUES (", ", 'disc_matrix', '{}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "], ["\n      INSERT INTO scoring_configs (test_id, formula_type, config_data)\n      VALUES (", ", 'disc_matrix', '{}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "])), testMap['DISC'])];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    if (!testMap['WPT']) return [3 /*break*/, 8];
                    return [4 /*yield*/, sql(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n      INSERT INTO question_banks (test_id, order_number, question_type, question_data)\n      VALUES \n        (", ", 1, 'multiple', '{\"text\": \"Bulan lalu pada awal tahun ini adalah:\", \"options\": [\"Januari\", \"Maret\", \"Juli\", \"Desember\"]}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "], ["\n      INSERT INTO question_banks (test_id, order_number, question_type, question_data)\n      VALUES \n        (", ", 1, 'multiple', '{\"text\": \"Bulan lalu pada awal tahun ini adalah:\", \"options\": [\"Januari\", \"Maret\", \"Juli\", \"Desember\"]}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "])), testMap['WPT'])];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, sql(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n      INSERT INTO scoring_configs (test_id, formula_type, config_data)\n      VALUES (", ", 'matching_key', '{\"1\": \"3\"}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "], ["\n      INSERT INTO scoring_configs (test_id, formula_type, config_data)\n      VALUES (", ", 'matching_key', '{\"1\": \"3\"}'::jsonb)\n      ON CONFLICT DO NOTHING;\n    "])), testMap['WPT'])];
                case 7:
                    _a.sent();
                    _a.label = 8;
                case 8:
                    console.log('Seeding completed!');
                    return [2 /*return*/];
            }
        });
    });
}
main().catch(console.error);
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;
