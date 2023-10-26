use std::time::Instant;

use skia_safe::{Canvas, Color4f, Data, Font, Image, Rect, TextBlob, Typeface, Point, TextEncoding};
use tracing::info;

const PINGFANG_SC: &[u8] = include_bytes!("../assets/PingFangSC-Regular.ttf");
const SF_PRO_TEXT: &[u8] = include_bytes!("../assets/SF-Pro.ttf");

pub struct Renderer {
    pingfang_type_face: Typeface,
    sf_pro_type_face: Typeface,
    frame_time: Instant,
    frame: usize,
    cur_frame: usize,
    width: usize,
    height: usize,
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
            pingfang_type_face,
            sf_pro_type_face,
            frame_time: Instant::now(),
            frame: 0,
            cur_frame: 0,
            width: 0,
            height: 0,
        }
    }

    pub fn render(&mut self, canvas: &Canvas) {
        canvas.clear(skia_safe::Color::from_rgb(0x33, 0x33, 0x33));
        let font = Font::from_typeface(&self.sf_pro_type_face, 16.);
        let text = format!("FPS: {}", self.cur_frame);
        let text_poses = text.chars().enumerate().map(|x| Point::new(0., x.0 as f32 * 100.)).collect::<Vec<_>>();
        let tb = TextBlob::from_pos_text(text.as_bytes(), &text_poses, &font, TextEncoding::UTF8).unwrap();
        canvas.draw_text_blob(
            &tb,
            (10., tb.bounds().height() + 10.),
            &skia_safe::Paint::new(Color4f::new(1., 1., 1., 1.), None),
        );
        let album_size = (self.height as f32 * 0.5).min(self.width as f32 * 0.4);
        canvas.draw_round_rect(
            Rect::from_xywh(
                (self.width as f32 / 7.0 * 3.0 - album_size) / 2.0,
                (self.height as f32 - album_size) / 2.0,
                album_size,
                album_size,
            ),
            album_size * 0.05,
            album_size * 0.05,
            skia_safe::Paint::new(Color4f::new(1., 1., 1., 1.), None).set_anti_alias(true),
        );
        self.frame += 1;
        if self.frame_time.elapsed().as_secs() > 0 {
            self.cur_frame = self.frame;
            self.frame = 0;
            self.frame_time = Instant::now();
        }
    }

    pub fn set_size(&mut self, width: usize, height: usize) {
        self.width = width;
        self.height = height;
    }

    pub fn set_lyric_lines(&mut self, lines: Vec<ws_protocol::LyricLine>) {
        info!("Loaded {} lyric lines", lines.len());
    }

    pub fn set_progress(&mut self, time: f64) {}

    pub fn set_album_image(&mut self, image: impl AsRef<[u8]>) {
        if let Some(image) = Image::from_encoded(Data::new_copy(image.as_ref())) {
            info!(
                "Loaded image with size {}x{}",
                image.width(),
                image.height()
            );
        }
    }
}
