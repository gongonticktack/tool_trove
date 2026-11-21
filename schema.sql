-- 技術スタック: 3Dシミュレーション系 OSS ツールレジストリ
-- Supabase SQL Editor で実行する

create table if not exists public.tech_stack_tools (
  id bigint generated always as identity primary key,
  name text not null unique,
  category text not null,
  license text,
  verdict text not null default 'ok' check (verdict in ('ok', 'caution', 'excluded')),
  summary text,
  notes text,
  url text,
  status text not null default 'undecided' check (status in ('undecided', 'want', 'testing', 'adopted', 'rejected')),
  memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tech_stack_tools enable row level security;

revoke all on public.tech_stack_tools from anon, authenticated;
grant select on public.tech_stack_tools to anon, authenticated;

drop policy if exists "tech_stack_tools public select" on public.tech_stack_tools;
create policy "tech_stack_tools public select"
  on public.tech_stack_tools
  for select
  to anon, authenticated
  using (true);

insert into public.tech_stack_tools (name, category, license, verdict, summary, notes, url, status, memo) values
('OpenUSD', 'シーン基盤・デジタルツイン', 'Modified Apache 2.0', 'ok',
 'Pixar発のシーン記述基盤。大規模3Dシーンの合成・共有フォーマットで、Omniverse / Isaac Sim の土台。デジタルツインのシーン共有に事実上の標準。',
 'AOUSD（Alliance for OpenUSD）で仕様の標準化が進行中。',
 'https://github.com/PixarAnimationStudios/OpenUSD', 'undecided', ''),
('TRELLIS.2', '3D生成AI', 'MIT', 'ok',
 'Microsoft の画像→3D生成モデル（4B）。写真1枚から PBR テクスチャ付きメッシュ（GLB）を生成。コード・ウェイトとも MIT で出力にも制限なし。',
 '一部のレンダリング依存ライブラリに非商用条項のものが混ざるという指摘あり。製品組み込み時は依存関係を確認すること。Linux + 大容量VRAM前提。',
 'https://github.com/microsoft/TRELLIS.2.git', 'undecided', ''),
('AniGen', '3D生成AI', 'MIT（本体コード）', 'caution',
 'VAST の一括生成モデル。写真1枚から形状・骨格・スキンウェイトを同時に生成し、そのまま動かせるアセットを出す。',
 '同梱拡張 extensions/CUBVH が NVIDIA instant-ngp 由来で「非商用・研究限定」。本体コードは MIT だが、商用パイプラインに入れるなら推論部分だけ切り分けて要確認。NVIDIA GPU 18GB以上のVRAMが必要。',
 'https://github.com/VAST-AI-Research/AniGen', 'undecided', ''),
('Hunyuan3D', '3D生成AI', '独自コミュニティライセンス', 'excluded',
 'Tencent の画像→3D生成モデル。オープンウェイトだが OSS ではないため対象外として記録。',
 'EU・英・韓国がライセンス対象外、月間100万ユーザー超では別途ライセンスが必要という条件付き。「クリーンなOSS」には入れない。',
 null, 'undecided', ''),
('COLMAP', '3D再構成・点群', 'BSD-3-Clause', 'ok',
 '写真測量の定番。SfM + MVS で写真群からカメラ姿勢・点群・メッシュを再構成するパイプライン。GUI / CLI / Python バインディング（pycolmap）あり。',
 '本体は new BSD。ビルド時の依存ライブラリによって結合後のライセンスに影響しうる旨の注記が COPYING にある。',
 'https://github.com/colmap/colmap', 'undecided', ''),
('Open3D', '3D再構成・点群', 'MIT', 'ok',
 '点群・メッシュ・RGB-D データ処理のライブラリ（C++ / Python）。位置合わせ（ICP）、セグメンテーション、表面再構成、可視化まで揃う。',
 '工場の点群検査やスキャンデータ前処理の土台に。',
 'https://github.com/isl-org/Open3D', 'undecided', ''),
('UniRig', 'リギング・アニメーション', 'MIT', 'ok',
 'VAST（Tripo系）/ 清華大学の自動リギング。メッシュから骨格とスキンウェイトを予測し FBX / GLB で出力。VRoid 系データで学習しており人型との相性が良い。',
 'コード・ウェイトとも MIT。CUDA GPU 8GB以上のVRAMが必要。後継の SkinTokens（同じく MIT）も公開されている。',
 'https://github.com/VAST-AI-Research/UniRig', 'undecided', ''),
('Mixamo', 'リギング・アニメーション', '非OSS（Adobe サービス）', 'excluded',
 '既存メッシュ専用の自動リグ＋アニメーションライブラリ。OSS ではないため対象外として記録。',
 '商用利用自体は可能なため、OSS 側にモーション資産が乏しい場合の補完として実務でよく使われる。',
 null, 'undecided', ''),
('Blender', 'モデリング・編集', 'GPL v3', 'ok',
 'モデリング・リグ修正・アニメーション・レンダリングの統合 DCC。自動リグの「第一稿」を手直しする仕上げ工程と、Rigify でのアニメーション付けに。',
 '本体は GPL だが、Blender で作った生成物（モデル・画像・.blend）の権利は制作者に帰属し商用利用可。公開する Python スクリプトは GPL 互換ライセンスが必要。',
 'https://www.blender.org/about/license/', 'undecided', ''),
('MuJoCo', '物理エンジン', 'Apache-2.0', 'ok',
 'Google DeepMind の汎用物理エンジン。接触の多いロボット運動や生体力学のシミュレーションに強く、強化学習研究の標準基盤。MJX で GPU 並列化も可能。',
 'C API + Python バインディング。2022年に Apache-2.0 で OSS 化。',
 'https://github.com/google-deepmind/mujoco', 'undecided', ''),
('Newton', '物理エンジン', 'Apache-2.0', 'ok',
 'Linux Foundation の GPU 物理エンジン（NVIDIA / Google DeepMind / Disney Research が開始）。NVIDIA Warp 基盤で MuJoCo Warp を統合し、OpenUSD をサポート。',
 'まだベータ段階で API が不安定。長期の本命候補として動向を追う位置づけ。',
 'https://github.com/newton-physics/newton', 'undecided', ''),
('Isaac Lab', 'ロボットシミュレーション', 'BSD-3-Clause', 'ok',
 'NVIDIA のロボット学習フレームワーク。Isaac Sim 上で強化学習・模倣学習・モーションプランニングのワークフローを統一し、RTX カメラ / LiDAR 等のセンサーシミュレーションを提供。',
 'フレームワーク本体は BSD-3（一部 Apache-2.0）。土台の Isaac Sim 本体のライセンスはバージョンにより異なるため、利用時にその版の条件を確認すること。',
 'https://isaac-sim.github.io/IsaacLab/v2.3.2/index.html', 'undecided', ''),
('Gazebo', 'ロボットシミュレーション', 'Apache-2.0', 'ok',
 'Open Robotics 系のロボットシミュレータ。物理・描画・センサーモデルを備え、ROS 2 連携の標準。工場ロボットやモバイルロボットの検証に。',
 '現行は gz-sim（Harmonic 等のリリース系列）。Gazebo Classic は 2025年1月に EOL。',
 'https://gazebosim.org/libs/sim/', 'undecided', ''),
('Webots', 'ロボットシミュレーション', 'Apache-2.0', 'ok',
 'Cyberbotics のロボットシミュレータ。導入が軽く、ロボット・車両・機械システムのモデリングから制御プログラムの検証まで一通りこなせる。ROS 2 連携あり。',
 '2018年に Apache-2.0 で OSS 化。教育・プロトタイピングの入口として手軽。',
 'https://github.com/cyberbotics/webots', 'undecided', '')
on conflict (name) do nothing;

notify pgrst, 'reload schema';
