mod lyric_renderer;
mod spring;

use std::{io::Cursor, time::Instant};

use anyhow::{Context, Result};
use byteorder::{WriteBytesExt, LE};
use skia_safe::{
    canvas::{self, SaveLayerFlags, SaveLayerRec},
    image_filters::CropRect,
    runtime_effect::ChildPtr,
    textlayout::{FontCollection, ParagraphBuilder, ParagraphStyle, TextStyle},
    utils::Camera3D,
    BlurStyle, Canvas, ClipOp, Color4f, Data, Font, FontMgr, IRect, ISize, Image, ImageFilter,
    MaskFilter, Paint, Point, RRect, Rect, RuntimeEffect, SamplingOptions, Shader, Size, TextBlob,
    TextEncoding, Typeface,
};
use tracing::info;

use self::lyric_renderer::LyricRenderer;

const PINGFANG_SC: &[u8] = include_bytes!("../assets/PingFangSC-Regular.ttf");
const SF_PRO_TEXT: &[u8] = include_bytes!("../assets/SF-Pro.ttf");

struct ImageSprite {
    image: Image,
    size: Size,
    position: Point,
    rotation: f32,
}

impl ImageSprite {
    pub fn new(image: Image, size: Size) -> Self {
        Self {
            image,
            size,
            position: Point::new(0., 0.),
            rotation: 0.0,
        }
    }

    pub fn set_size(&mut self, size: Size) {
        self.size = size;
    }

    pub fn set_position(&mut self, position: Point) {
        self.position = position;
    }

    pub fn set_rotation(&mut self, rotation: f32) {
        self.rotation = rotation;
    }

    pub fn size(&self) -> Size {
        self.size
    }

    pub fn position(&self) -> Point {
        self.position
    }

    pub fn rotation(&self) -> f32 {
        self.rotation
    }

    pub fn render(&self, canvas: &Canvas) {
        canvas.save();
        canvas.translate((
            self.position.x - self.size.width / 2.0,
            self.position.y - self.size.height / 2.0,
        ));
        canvas.rotate(
            self.rotation,
            Some(Point::new(self.size.width / 2.0, self.size.height / 2.0)),
        );
        canvas.draw_image_rect(
            &self.image,
            None,
            Rect::from_size(self.size),
            &Paint::default(),
        );
        canvas.restore();
    }
}

struct BarrelRoller {
    img1: ImageSprite,
    img2: ImageSprite,
    img3: ImageSprite,
    img4: ImageSprite,
    alpha: f32,
}

impl BarrelRoller {
    pub fn new(img: Image) -> Self {
        Self {
            img1: ImageSprite::new(img.clone(), Size::new_empty()),
            img2: ImageSprite::new(img.clone(), Size::new_empty()),
            img3: ImageSprite::new(img.clone(), Size::new_empty()),
            img4: ImageSprite::new(img.clone(), Size::new_empty()),
            alpha: 1.0,
        }
    }

    pub fn render(&mut self, canvas: &Canvas, delta: f64) {}
}

pub struct Renderer {
    pingfang_type_face: Typeface,
    sf_pro_type_face: Typeface,
    lyric_renderer: LyricRenderer,
    fps_time: Instant,
    frame_time: Instant,
    frame: usize,
    cur_frame: usize,
    progress: f64,
    width: usize,
    height: usize,
    cur_album_images: Option<Image>,
    fading_album_images: Vec<(Image, Instant)>,
    cur_bg_objs: Option<BarrelRoller>,
    fading_bg_objs: Vec<BarrelRoller>,
    vsync: bool,
}

struct LyricLineObject {
    line: ws_protocol::LyricLine,
}

impl Renderer {
    pub fn new() -> Self {
        let pingfang_type_face =
            Typeface::from_data(unsafe { Data::new_bytes(PINGFANG_SC) }, None).unwrap();
        let sf_pro_type_face =
            Typeface::from_data(unsafe { Data::new_bytes(SF_PRO_TEXT) }, None).unwrap();

        Self {
            lyric_renderer: LyricRenderer::new(
                pingfang_type_face.clone(),
                sf_pro_type_face.clone(),
            ),
            pingfang_type_face,
            progress: 0.,
            sf_pro_type_face,
            fps_time: Instant::now(),
            frame_time: Instant::now(),
            frame: 0,
            cur_frame: 0,
            width: 0,
            height: 0,
            cur_album_images: None,
            fading_album_images: Vec::with_capacity(16),
            cur_bg_objs: None,
            fading_bg_objs: Vec::with_capacity(16),
            vsync: true,
        }
    }

    pub fn render(&mut self, canvas: &Canvas) {
        canvas.clear(skia_safe::Color::from_rgb(0x33, 0x33, 0x33));

        self.draw_background(canvas);
        self.draw_album_image(canvas);

        let debug_text_x = 10.;
        let mut debug_text_y = 10.;
        debug_text_y += self.draw_debug_text(
            canvas,
            "娱乐项目，随时丢掉",
            Point::new(debug_text_x, debug_text_y),
        );
        debug_text_y += self.draw_debug_text(
            canvas,
            &format!("当前帧率 FPS: {}", self.cur_frame),
            Point::new(debug_text_x, debug_text_y),
        );
        debug_text_y += self.draw_debug_text(
            canvas,
            &format!("当前时间刻：{}", self.progress),
            Point::new(debug_text_x, debug_text_y),
        );
        if self.vsync {
            debug_text_y += self.draw_debug_text(
                canvas,
                "垂直同步已启用（按 V 键可切换）",
                Point::new(debug_text_x, debug_text_y),
            );
        } else {
            debug_text_y += self.draw_debug_text(
                canvas,
                "垂直同步已禁用（按 V 键可切换）",
                Point::new(debug_text_x, debug_text_y),
            );
        }

        self.frame += 1;
        if self.fps_time.elapsed().as_secs() > 0 {
            self.cur_frame = self.frame;
            self.frame = 0;
            self.fps_time = Instant::now();
        }
        self.frame_time = Instant::now();
    }

    fn draw_debug_text(&self, canvas: &Canvas, text: &str, pos: Point) -> f32 {
        let font = Font::from_typeface(&self.pingfang_type_face, 16.);
        let tb = TextBlob::new(text, &font).unwrap();
        canvas.draw_text_blob(
            &tb,
            (pos.x + 1., pos.y + tb.bounds().height() + 1.),
            &skia_safe::Paint::new(Color4f::new(0.2, 0.2, 0.2, 1.), None),
        );
        canvas.draw_text_blob(
            &tb,
            (pos.x, pos.y + tb.bounds().height()),
            &skia_safe::Paint::new(Color4f::new(1., 1., 1., 1.), None),
        );
        tb.bounds().height() + 1.
    }

    pub fn set_vsync(&mut self, vsync: bool) {
        self.vsync = vsync;
    }

    fn draw_background(&mut self, canvas: &Canvas) {
        // Draw album image as background and blur it

        if let Some(cur_album_images) = &self.cur_album_images {
            canvas.save();
            // canvas.clip_rect(Rect::new(0., 0., self.width as f32, self.height as f32), ClipOp::Difference, true);
            canvas.draw_image_rect(
                cur_album_images,
                None,
                Rect::new(
                    -60.,
                    -60.,
                    self.width as f32 + 60.,
                    self.height as f32 + 60.,
                ),
                &Paint::new(Color4f::new(1., 1., 1., 1.), None),
            );
            let _ = self.blur_screen(canvas, 5.);
            let _ = self.blur_screen(canvas, 10.);
            let _ = self.blur_screen(canvas, 20.);
            let _ = self.blur_screen(canvas, 40.);
            let _ = self.blur_screen(canvas, 80.);
            let min_border = self.width.min(self.height);
            if min_border > 768 {
                let _ = self.blur_screen(canvas, 160.);
                if min_border > 768 * 2 {
                    let _ = self.blur_screen(canvas, 320.);
                }
            }
            let _ = self.blur_screen(canvas, 5.);
            let _ = self.blur_screen(canvas, 2.);
            canvas.restore();
        }
    }

    fn blur_screen(&mut self, canvas: &Canvas, strength: f32) -> Result<()> {
        debug_assert!(strength >= 0.0);
        // Skia Safe 缺乏 SkRuntimeEffectBuilder 支持
        fn take_snapshot(canvas: &Canvas, width: usize, height: usize) -> Result<Shader> {
            unsafe { canvas.surface() }
                .context("Failed to get surface")?
                .image_snapshot_with_bounds(IRect::from_size(ISize::new(width as _, height as _)))
                .context("Failed to get image snapshot")?
                .to_shader(None, SamplingOptions::default(), None)
                .context("Failed to take snapshot")
        }
        fn blur_once(
            canvas: &Canvas,
            width: usize,
            height: usize,
            strength_x: f32,
            strength_y: f32,
        ) -> Result<()> {
            let snapshot = take_snapshot(canvas, width, height)?;
            let mut data = Cursor::new(vec![0u8; 4]);
            data.write_f32::<LE>(width as _)?;
            data.write_f32::<LE>(height as _)?;
            data.write_f32::<LE>(strength_x)?;
            data.write_f32::<LE>(strength_y)?;
            let effect =
                RuntimeEffect::make_for_shader(include_str!("./renderer/kawase-blur.sksl"), None)
                    .unwrap();
            let shader = effect
                .make_shader(
                    Data::new_copy(data.into_inner().as_slice()),
                    &[ChildPtr::Shader(snapshot)],
                    None,
                )
                .context("Failed to make shader")?;
            canvas.draw_paint(Paint::new(Color4f::new(1., 1., 1., 1.), None).set_shader(shader));
            Ok(())
        }
        blur_once(canvas, self.width, self.height, strength, 0.0)?;
        blur_once(canvas, self.width, self.height, 0.0, strength)?;
        Ok(())
    }

    fn draw_album_image(&mut self, canvas: &Canvas) {
        let album_size = (self.height as f32 * 0.5).min(self.width as f32 * 0.4);
        let rect = Rect::from_xywh(
            (self.width as f32 / 7.0 * 3.0 - album_size) / 2.0,
            (self.height as f32 - album_size) / 2.0,
            album_size,
            album_size,
        );
        let radius = album_size * 0.05;
        let rrect = RRect::new_rect_xy(rect, radius, radius);

        canvas.save();
        canvas.clip_rrect(rrect, None, Some(true));
        if let Some(img) = &self.cur_album_images {
            canvas.draw_image_rect_with_sampling_options(
                img,
                None,
                rect,
                SamplingOptions::new(skia_safe::FilterMode::Linear, skia_safe::MipmapMode::Linear),
                &skia_safe::Paint::new(Color4f::new(1., 1., 1., 1.), None),
            );
        }
        self.fading_album_images
            .retain(|(_, time)| time.elapsed().as_secs_f32() < 1.0);
        for (img, time) in &self.fading_album_images {
            let alpha = 1.0 - time.elapsed().as_secs_f32();
            canvas.draw_image_rect(
                img,
                None,
                rect,
                &skia_safe::Paint::new(Color4f::new(1., 1., 1., alpha), None),
            );
        }
        canvas.restore();
        self.lyric_renderer.render(canvas);
    }

    pub fn set_size(&mut self, width: usize, height: usize) {
        self.width = width;
        self.height = height;
        self.lyric_renderer.set_rect(Rect::from_xywh(
            self.width as f32 / 7.0 * 3.0,
            0.,
            self.width as f32 / 7.0 * 4.0,
            self.height as f32,
        ))
    }

    pub fn set_lyric_lines(&mut self, lines: Vec<ws_protocol::LyricLine>) {
        info!("Loaded {} lyric lines", lines.len());
        self.lyric_renderer.set_lines(lines);
    }

    pub fn set_progress(&mut self, time: f64) {
        self.progress = time;
        self.lyric_renderer.set_progress(time);
    }

    pub fn set_album_image(&mut self, image: impl AsRef<[u8]>) {
        if let Some(image) = Image::from_encoded(Data::new_copy(image.as_ref())) {
            info!(
                "Loaded image with size {}x{}",
                image.width(),
                image.height()
            );
            if let Some(img) = self.cur_album_images.take() {
                self.fading_album_images.push((img, Instant::now()));
            }
            self.cur_album_images = Some(image);
        }
    }
}
