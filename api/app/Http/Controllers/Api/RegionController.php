<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RegionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            Region::query()
                ->orderBy('name')
                ->get()
                ->map(fn (Region $region): array => $this->toArray($region))
        );
    }

    public function store(Request $request): JsonResponse
    {
        $region = Region::query()->create($this->data($request));

        return response()->json($this->toArray($region), 201);
    }

    public function show(Region $region): JsonResponse
    {
        return response()->json($this->toArray($region));
    }

    public function update(Request $request, Region $region): JsonResponse
    {
        $region->update($this->data($request));

        return response()->json($this->toArray($region->refresh()));
    }

    public function destroy(Region $region): JsonResponse
    {
        $region->delete();

        return response()->json(null, 204);
    }

    private function data(Request $request): array
    {
        return [
            'name' => $this->upperString($request->input('name', $request->input('nome'))),
            'description' => $this->nullableString($request->input('description', $request->input('descrizione'))),
        ];
    }

    private function toArray(Region $region): array
    {
        return [
            'id' => (string) $region->id,
            'name' => $region->name,
            'description' => $region->description,
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

    private function upperString(mixed $value): ?string
    {
        $value = $this->nullableString($value);

        return $value === null ? null : Str::upper($value);
    }
}
