<?php
namespace App\Services;
use Illuminate\Support\Facades\DB;
class LegacyMedicalCodeService { public function next(string $entity): string { $map=['branch'=>['branch','code','BR','deleted_at IS NULL'],'doctor'=>['doctor','doctor_code','DT','1=1'],'patient'=>['patient','patient_code','PT','1=1'],'prescription'=>['prescription','prescription_code','RX','1=1']];[$table,$column,$suffix,$where]=$map[$entity];$date=now()->format('dmY');$prefix="HLR_MED_{$date}_{$suffix}";$max=DB::selectOne("SELECT MAX(CAST(SUBSTRING($column, ?) AS UNSIGNED)) AS maxSequence FROM $table WHERE $column LIKE ? AND $where",[strlen($prefix)+1,"$prefix%"])->maxSequence??0;return $prefix.str_pad((string)((int)$max+1),4,'0',STR_PAD_LEFT);}}
