<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductModelController extends Controller
{
    public function index(): JsonResponse
    {
        $models = ProductModel::query()
            ->orderBy('name')
            ->get()
            ->map(fn (ProductModel $productModel): array => $this->toFrontend($productModel));

        return response()->json($models);
    }

    public function store(Request $request): JsonResponse
    {
        $productModel = ProductModel::query()->create($this->modelData($request));

        return response()->json($this->toFrontend($productModel), 201);
    }

    public function show(ProductModel $productModel): JsonResponse
    {
        return response()->json($this->toFrontend($productModel));
    }

    public function update(Request $request, ProductModel $productModel): JsonResponse
    {
        $productModel->update($this->modelData($request));

        return response()->json($this->toFrontend($productModel->refresh()));
    }

    public function destroy(ProductModel $productModel): JsonResponse
    {
        if ($productModel->orderItems()->exists()) {
            return response()->json([
                'message' => 'Il modello e utilizzato in uno o piu ordini.',
            ], 409);
        }

        $productModel->delete();

        return response()->json(null, 204);
    }

    private function modelData(Request $request): array
    {
        return [
            'name' => $this->nullableString($request->input('nome', $request->input('name'))),
            'description' => $this->nullableString($request->input('descrizione', $request->input('description'))),
            'is_active' => $request->has('is_active') ? (bool) $request->input('is_active') : null,
        ];
    }

    private function toFrontend(ProductModel $productModel): array
    {
        return [
            'id' => (string) $productModel->id,
            'nome' => $productModel->name ?? '',
            'descrizione' => $productModel->description,
        ];
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
