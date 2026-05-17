<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductModelController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\TownController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login']);

Route::get('clienti/ordini-count', [CustomerController::class, 'orderCounts']);

Route::apiResource('clienti', CustomerController::class)
    ->parameters(['clienti' => 'customer']);

Route::apiResource('modelli', ProductModelController::class)
    ->parameters(['modelli' => 'productModel']);

Route::apiResource('ordini', OrderController::class)
    ->parameters(['ordini' => 'order']);

Route::apiResource('regions', RegionController::class);
Route::apiResource('towns', TownController::class);
