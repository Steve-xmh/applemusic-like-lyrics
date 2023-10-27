mod lyric_renderer;
mod spring;

use std::time::Instant;

use skia_safe::{
    canvas::{SaveLayerFlags, SaveLayerRec},
    image_filters::CropRect,
    textlayout::{FontCollection, ParagraphBuilder},
    utils::Camera3D,
    BlurStyle, Canvas, Color4f, Data, Font, Image, ImageFilter, MaskFilter, Paint, Point, RRect,
    Rect, SamplingOptions, TextBlob, TextEncoding, Typeface, ClipOp,
};
use tracing::info;

use self::lyric_renderer::LyricRenderer;

const PINGFANG_SC: &[u8] = include_bytes!("../assets/PingFangSC-Regular.ttf");
const SF_PRO_TEXT: &[u8] = include_bytes!("../assets/SF-Pro.ttf");

pub struct Renderer {
    pingfang_type_face: Typeface,
    sf_pro_type_face: Typeface,
    lyric_renderer: LyricRenderer,
    frame_time: Instant,
    frame: usize,
    cur_frame: usize,
    width: usize,
    height: usize,
    cur_album_images: Option<Image>,
    fading_album_images: Vec<(Image, Instant)>,
}

struct LyricLineObject {
    line: ws_protocol::LyricLine,
}

impl Renderer {
    pub fn new() -> Self {
        let pingfang_type_face =
            Typeface::from_data(unsafe { Data::new_bytes(PINGFANG_SC) }, None).unwrap();
        info!("Loaded font {}", pingfang_type_face.family_name());
        let sf_pro_type_face =
            Typeface::from_data(unsafe { Data::new_bytes(SF_PRO_TEXT) }, None).unwrap();
        info!("Loaded font {}", sf_pro_type_face.family_name());

        Self {
            lyric_renderer: LyricRenderer::new(
                pingfang_type_face.clone(),
                sf_pro_type_face.clone(),
            ),
            pingfang_type_face,
            sf_pro_type_face,
            frame_time: Instant::now(),
            frame: 0,
            cur_frame: 0,
            width: 0,
            height: 0,
            cur_album_images: None,
            fading_album_images: Vec::with_capacity(16),
        }
    }

    pub fn render(&mut self, canvas: &Canvas) {
        canvas.clear(skia_safe::Color::from_rgb(0x33, 0x33, 0x33));
        self.draw_album_image(canvas);

        let font = Font::from_typeface(&self.pingfang_type_face, 16.);
        let text = format!("当前帧率 FPS: {}", self.cur_frame);
        let tb = TextBlob::new(text, &font).unwrap();
        canvas.draw_text_blob(
            &tb,
            (10., tb.bounds().height() + 10.),
            &skia_safe::Paint::new(Color4f::new(1., 1., 1., 1.), None),
        );
        
        self.frame += 1;
        if self.frame_time.elapsed().as_secs() > 0 {
            self.cur_frame = self.frame;
            self.frame = 0;
            self.frame_time = Instant::now();
        }
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

        // Draw album image as background and blur it

        if let Some(cur_album_images) = &self.cur_album_images {
            canvas.save();
            // canvas.clip_rect(Rect::new(0., 0., self.width as f32, self.height as f32), ClipOp::Difference, true);
            canvas.draw_image_rect(
                cur_album_images,
                None,
                Rect::new(-60., -60., self.width as f32 + 60., self.height as f32 + 60.),
                &Paint::new(Color4f::new(1., 1., 1., 1.), None),
            );
            canvas.save_layer(
                &SaveLayerRec::default()
                    .flags(SaveLayerFlags::INIT_WITH_PREVIOUS)
                    .paint(
                        Paint::new(Color4f::new(1., 1., 1., 1.), None).set_image_filter(
                            skia_safe::image_filters::blur(
                                (60., 60.),
                                Some(skia_safe::TileMode::Mirror),
                                None,
                                CropRect::NO_CROP_RECT,
                            ),
                        ),
                    ),
            );
            canvas.draw_color(Color4f::new(0., 0., 0., 0.), None);
            canvas.restore();
        }

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
