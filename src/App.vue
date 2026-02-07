<template>
  <div class="app">
    <header class="topbar">
      <div class="topbar-left">
        <button class="brand-btn" @click="navigate('/')">WieTeach</button>
        <nav class="top-nav">
          <button
            class="nav-btn"
            :class="{ active: routePath === '/' }"
            @click="navigate('/')"
          >
            Dashboard
          </button>
          <button
            class="nav-btn"
            :class="{ active: routePath === '/class' }"
            @click="navigate('/class')"
          >
            Class
          </button>
          <button
            class="nav-btn"
            :class="{ active: routePath === '/recordings' }"
            @click="navigate('/recordings')"
          >
            Recordings
          </button>
        </nav>
        <button
          v-if="isClassRoute"
          class="icon-btn topbar-lock-btn"
          :class="{ active: webcam.locked }"
          :disabled="!webcam.enabled"
          :title="webcam.locked ? 'Unlock camera' : 'Lock camera'"
          @click="webcam.locked = !webcam.locked"
        >
          <svg v-if="webcam.locked" viewBox="0 0 24 24">
            <path d="M7 11V8a5 5 0 0 1 10 0v3" />
            <rect x="5" y="11" width="14" height="9" rx="2" />
          </svg>
          <svg v-else viewBox="0 0 24 24">
            <path d="M7 11V8a5 5 0 0 1 10 0" />
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M17 11V8" />
          </svg>
        </button>
      </div>
      <div class="topbar-right">
        <input
          ref="importInput"
          type="file"
          accept="application/json"
          class="sr-only"
          @change="handleImport"
        />
        <input
          ref="pdfInput"
          type="file"
          accept="application/pdf"
          class="sr-only"
          @change="handlePdfImport"
        />
        <input
          ref="templateInput"
          type="file"
          accept="image/*"
          class="sr-only"
          multiple
          @change="handleTemplateUpload"
        />

        <template v-if="isClassRoute">
          <div class="topbar-av">
            <div
              class="av-pill"
              :class="{ disabled: !avControls.cameraEnabled }"
            >
              <button
                class="icon-btn"
                :class="{ active: avControls.cameraEnabled }"
                :title="
                  avControls.cameraEnabled ? 'Stop camera' : 'Start camera'
                "
                @click="toggleCamera"
              >
                <svg v-if="!avControls.cameraEnabled" viewBox="0 0 24 24">
                  <path
                    d="M5 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm12 2l4-2v12l-4-2V8z"
                  />
                  <path d="M9 9l6 3-6 3V9z" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path
                    d="M5 6h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm12 2l4-2v12l-4-2V8z"
                  />
                  <path d="M9 9h6v6H9z" />
                </svg>
              </button>
              <button
                class="icon-btn pause-btn"
                :class="{
                  active: camPaused,
                  disabled: !avControls.cameraEnabled,
                }"
                :title="camPaused ? 'Resume camera' : 'Pause camera'"
                :disabled="!avControls.cameraEnabled"
                @click="toggleCamPause"
              >
                <svg v-if="!camPaused" viewBox="0 0 24 24">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </button>
            </div>
            <div class="av-pill" :class="{ disabled: !avControls.micEnabled }">
              <button
                class="icon-btn"
                :class="{ active: avControls.micEnabled }"
                :title="avControls.micEnabled ? 'Mute mic' : 'Unmute mic'"
                @click="toggleMic"
              >
                <span
                  class="mic-level"
                  :style="{ height: `${Math.round(micLevel * 100)}%` }"
                ></span>
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z"
                  />
                  <path d="M5 12a7 7 0 0 0 14 0" />
                  <path d="M12 19v2" />
                </svg>
              </button>
              <button
                class="icon-btn pause-btn"
                :class="{
                  active: micPaused,
                  disabled: !avControls.micEnabled,
                }"
                :title="micPaused ? 'Resume mic' : 'Pause mic'"
                :disabled="!avControls.micEnabled"
                @click="toggleMicPause"
              >
                <svg v-if="!micPaused" viewBox="0 0 24 24">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </button>
            </div>
            <select
              class="compact-select"
              v-model="precheck.cameraId"
              @change="handleCameraDeviceChange"
              @focus="ensureAvPermissions"
              title="Camera device"
            >
              <option value="">Camera</option>
              <option
                v-for="(dev, idx) in cameras"
                :key="dev.deviceId"
                :value="dev.deviceId"
              >
                {{ dev.label || `Camera ${idx + 1}` }}
              </option>
            </select>
            <select
              class="compact-select"
              v-model="precheck.micId"
              @change="handleMicDeviceChange"
              @focus="ensureAvPermissions"
              @mousedown="ensureAvPermissions"
              @click="ensureAvPermissions"
              title="Microphone device"
            >
              <option value="">Mic</option>
              <option
                v-for="(dev, idx) in microphones"
                :key="dev.deviceId"
                :value="dev.deviceId"
              >
                {{ dev.label || `Mic ${idx + 1}` }}
              </option>
            </select>
            <div class="recording-status" :class="{ active: isRecording }">
              <span class="record-dot"></span>
              <span>{{ recordingTimeLabel }}</span>
              <span v-if="recordingSaveStatus" class="recording-save-status">
                {{ recordingSaveStatus }}
              </span>
              <span
                v-if="audacityBridgeUrl"
                class="audacity-status-pill"
                :class="audacityStatus.state"
                :title="`Audacity: ${audacityStatus.text}`"
              >
                <span class="audacity-dot"></span>
                <span class="audacity-text">Audacity</span>
              </span>
              <button
                v-if="audacityBridgeUrl"
                class="mini-btn header-toggle audacity-record-btn"
                :class="{ active: audacityRecording }"
                :title="audacityRecording ? 'Stop Audacity' : 'Start Audacity'"
                @click="toggleAudacityRecording"
              >
                <svg v-if="!audacityRecording" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="6" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <rect x="7" y="7" width="10" height="10" rx="1.5" />
                </svg>
              </button>
              <button
                class="mini-btn header-toggle"
                :class="{ active: recordingSaveToDisk }"
                title="Save to disk"
                aria-label="Save to disk"
                @click="recordingSaveToDisk = !recordingSaveToDisk"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h12l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
                  <path d="M7 4v6h10V6" />
                  <rect x="7" y="14" width="10" height="6" rx="1" />
                </svg>
              </button>
            </div>
            <div class="recording-ctrls">
              <!-- <button class="icon-btn" title="Start/Stop" @click="toggleRecordings">
                <svg v-if="!isRecording" viewBox="0 0 24 24">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M6 6h12v12H6z" />
                </svg>
              </button> -->
              <button
                class="icon-btn"
                :disabled="!isRecording"
                title="Pause/Resume"
                @click="toggleRecordingPause"
              >
                <svg v-if="!recordingPaused" viewBox="0 0 24 24">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </button>
              <button
                class="icon-btn"
                title="Open Live Preview"
                @click="openLivePreview"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M4 6h16v12H4z" />
                  <path d="M10 9l5 3-5 3z" />
                </svg>
              </button>
            </div>
          </div>
          <!-- <button class="pill-btn ghost">Poll</button> -->
          <button
            class="pill-btn primary start-class-btn"
            @click="openPrestart"
          >
            <svg v-if="!isRecording" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 4l14 8-14 8z" />
            </svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6h12v12H6z" />
            </svg>
            <span>{{ isRecording ? "Stop Recording" : "Start Class" }}</span>
          </button>
        </template>
        <template v-else>
          <button class="pill-btn ghost" @click="navigate('/recordings')">
            Open Recordings
          </button>
          <button class="pill-btn primary" @click="navigate('/class')">
            Start Class
          </button>
        </template>
      </div>
    </header>

    <main class="dashboard-shell" v-show="isDashboardRoute">
      <section class="dashboard-hero">
        <div>
          <p class="eyebrow">Welcome back</p>
          <h1>WieTeach</h1>
          <p class="muted">
            Launch a class, manage recordings, and keep every lesson organized.
          </p>
          <div class="hero-actions">
            <button class="pill-btn primary" @click="navigate('/class')">
              Start New Class
            </button>
            <button class="pill-btn ghost" @click="navigate('/recordings')">
              Open Recordings
            </button>
          </div>
        </div>
        <div class="hero-card">
          <div class="hero-stat">
            <span>Total Recordings</span>
            <strong>{{ recordings.length }}</strong>
          </div>
          <div class="hero-stat">
            <span>Total Storage</span>
            <strong>{{ formatBytes(totalRecordingSize) }}</strong>
          </div>
          <div class="hero-stat">
            <span>Latest</span>
            <strong>{{
              recordings[0]?.createdAt || "No recordings yet"
            }}</strong>
          </div>
        </div>
      </section>

      <section class="dashboard-grid">
        <div class="dashboard-card">
          <h3>Quick Actions</h3>
          <button class="ghost-btn" @click="navigate('/class')">
            Resume Class
          </button>
          <button class="ghost-btn" @click="navigate('/recordings')">
            Browse Recordings
          </button>
          <button class="ghost-btn" @click="openSettingsFromDashboard">
            Import / Export
          </button>
        </div>
        <div class="dashboard-card">
          <h3>Recent Recordings</h3>
          <div v-if="recordings.length === 0" class="empty-state">
            No recordings yet
          </div>
          <div v-else class="recording-mini-list">
            <div
              v-for="rec in recordings.slice(0, 3)"
              :key="rec.id"
              class="recording-mini"
            >
              <div>
                <div class="recording-name">{{ rec.name }}</div>
                <div class="recording-meta">
                  {{ formatBytes(rec.size) }} • {{ rec.createdAt }}
                </div>
              </div>
              <button class="mini-btn" @click="downloadRecording(rec)">
                ↓
              </button>
            </div>
          </div>
        </div>
        <div class="dashboard-card">
          <h3>Tips</h3>
          <ul class="tip-list">
            <li>
              Press <strong>P</strong> for pen, <strong>E</strong> for eraser.
            </li>
            <li>Hold <strong>Alt</strong> to scale selections.</li>
            <li>Use the slide dock to reorder quickly.</li>
          </ul>
        </div>
      </section>
    </main>

    <main class="recordings-shell" v-show="isRecordingsRoute">
      <section class="recordings-header">
        <div>
          <h1>Recordings</h1>
          <p class="muted">
            Preview, download, and manage your class captures.
          </p>
        </div>
        <div class="recordings-actions">
          <input
            class="search-input"
            type="search"
            placeholder="Search recordings..."
            v-model="recordingSearch"
          />
          <div class="view-toggle">
            <button
              class="icon-btn"
              :class="{ active: recordingView === 'list' }"
              @click="recordingView = 'list'"
            >
              <svg viewBox="0 0 24 24">
                <path d="M5 6h14M5 12h14M5 18h14" />
              </svg>
            </button>
            <button
              class="icon-btn"
              :class="{ active: recordingView === 'compact' }"
              @click="recordingView = 'compact'"
            >
              <svg viewBox="0 0 24 24">
                <path
                  d="M6 6h6v6H6zM14 6h4M14 10h4M6 14h6v6H6zM14 14h4M14 18h4"
                />
              </svg>
            </button>
            <button
              class="icon-btn"
              :class="{ active: recordingView === 'grid' }"
              @click="recordingView = 'grid'"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
              </svg>
            </button>
          </div>
        </div>
      </section>
      <section class="recordings-stats">
        <div>
          <span>Total</span>
          <strong>{{ recordings.length }}</strong>
        </div>
        <div>
          <span>Storage</span>
          <strong>{{ formatBytes(totalRecordingSize) }}</strong>
        </div>
        <div>
          <span>Latest</span>
          <strong>{{ recordings[0]?.createdAt || "—" }}</strong>
        </div>
      </section>
      <section class="recordings-list" :class="`view-${recordingView}`">
        <div v-if="filteredRecordings.length === 0" class="empty-state">
          No recordings found.
        </div>
        <div
          v-for="rec in filteredRecordings"
          :key="rec.id"
          class="recording-card"
        >
          <div class="recording-thumb" @click="openRecordingPreview(rec)">
            <video :src="getRecordingUrl(rec)" muted preload="metadata"></video>
            <button class="preview-btn" title="Preview">▶</button>
          </div>
          <div class="recording-info">
            <div class="recording-name">{{ rec.name }}</div>
            <div class="recording-meta">
              {{ formatBytes(rec.size) }} • {{ rec.createdAt }}
            </div>
          </div>
          <div class="recording-card-actions">
            <button class="action-btn" @click="openRecordingPreview(rec)">
              Preview
            </button>
            <button class="action-btn" @click="downloadRecording(rec)">
              Download
            </button>
            <button class="action-btn danger" @click="deleteRecording(rec.id)">
              Delete
            </button>
          </div>
        </div>
      </section>
      <div v-if="previewRecording" class="preview-backdrop">
        <div class="preview-modal">
          <div class="preview-header">
            <div>
              <strong>{{ previewRecording.name }}</strong>
              <div class="recording-meta">
                {{ formatBytes(previewRecording.size) }} •
                {{ previewRecording.createdAt }}
              </div>
            </div>
            <button class="close-btn" @click="closeRecordingPreview">
              &times;
            </button>
          </div>
          <video
            class="preview-video"
            :src="getRecordingUrl(previewRecording)"
            controls
            autoplay
          ></video>
        </div>
      </div>
    </main>

    <div v-if="toast.visible" class="toast" :class="toast.type">
      <span>{{ toast.message }}</span>
      <button
        v-if="toast.actionLabel"
        class="toast-action"
        @click="handleToastAction"
      >
        {{ toast.actionLabel }}
      </button>
    </div>

    <main class="board-shell" v-show="isClassRoute">
      <div class="board-area">
        <div class="left-rail">
          <div class="rail-pill">
            <span class="rail-arrow">&#9664;</span>
            <span>{{ zoomLabel }}</span>
          </div>
        </div>

        <div class="bottom-toolbar left" ref="leftDock">
          <button
            class="icon-btn"
            title="Undo"
            :style="undoStyle"
            @click="undo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 4L4 9l5 5" />
              <path d="M4 9h9a6 6 0 1 1 0 12h-3" />
            </svg>
          </button>
          <button
            class="icon-btn"
            title="Redo"
            :style="redoStyle"
            @click="redo"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 4l5 5-5 5" />
              <path d="M20 9h-9a6 6 0 1 0 0 12h3" />
            </svg>
          </button>
          <span class="dock-divider"></span>
          <button
            class="tool-btn"
            :class="{ active: tool === 'select' }"
            @click="setTool('select')"
            title="Select"
          >
            <svg viewBox="0 0 24 24">
              <path
                d="M4 4h6M14 4h6M4 4v6M20 4v6M4 14v6M20 14v6M4 20h6M14 20h6"
              />
            </svg>
          </button>
          <button
            class="tool-btn"
            :class="{ active: tool === 'pointer' }"
            @click="setTool('pointer')"
            title="Pointer"
          >
            <svg viewBox="0 0 24 24">
              <path d="M5 3l7 15 2-5 5-2L5 3z" />
            </svg>
          </button>
          <button
            class="tool-btn"
            :class="{ active: tool === 'fill' }"
            @click="toggleFillPopover"
            title="Fill"
          >
            <svg viewBox="0 0 24 24">
              <path d="M3 12l7-7 8 8-7 7H3v-8z" />
              <path d="M14 5l2-2 4 4-2 2" />
            </svg>
          </button>

          <button
            class="icon-btn"
            title="Settings"
            @click="toggleSettingsPopover"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="6" r="2.2" />
              <circle cx="12" cy="12" r="2.2" />
              <circle cx="12" cy="18" r="2.2" />
            </svg>
          </button>
        </div>

        <div class="board-stage" ref="boardStage">
          <div class="canvas-stack" ref="canvasStack">
            <canvas id="backgroundCanvas" ref="backgroundCanvas"></canvas>
            <canvas
              id="inkCanvas"
              ref="inkCanvas"
              @pointerdown="handlePointerDown"
              @pointermove="handlePointerMove"
              @pointerup="handlePointerUp"
              @pointercancel="handlePointerUp"
            ></canvas>
            <canvas id="overlayCanvas" ref="overlayCanvas"></canvas>
            <div class="widget-layer">
              <div
                v-for="widget in widgets"
                :key="widget.id"
                class="widget-shell"
                :ref="(el) => setWidgetDomRef(widget.id, el)"
                :class="{
                  active: widget.id === activeWidgetId,
                  dragging: widget.dragging,
                  resizing: widget.resizing,
                  'audience-hidden': !widget.showForUsers,
                }"
                :style="getWidgetStyle(widget)"
              >
                <div class="widget-card">
                  <div
                    class="widget-header"
                    @pointerdown.stop="onWidgetDragStart(widget, $event)"
                  >
                    <span class="widget-title">
                      {{ getWidgetTitle(widget) }}
                    </span>
                    <div class="widget-header-actions">
                      <span
                        v-if="!widget.showForUsers"
                        class="widget-hidden-pill"
                      >
                        Hidden
                      </span>
                      <button
                        class="widget-icon-btn"
                        :class="{ active: widget.showForUsers }"
                        :title="
                          widget.showForUsers
                            ? 'Hide from students'
                            : 'Show to students'
                        "
                        @click.stop="toggleWidgetAudience(widget)"
                      >
                        <svg v-if="widget.showForUsers" viewBox="0 0 24 24">
                          <path
                            d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z"
                          />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <svg v-else viewBox="0 0 24 24">
                          <path d="M3 5l16 16M2 12s4-6 10-6c2 0 4 1 6 2" />
                          <path d="M22 12s-4 6-10 6c-2 0-4-1-6-2" />
                          <path d="M9.5 9.5A3 3 0 0 0 12 15" />
                        </svg>
                      </button>
                      <button
                        class="widget-icon-btn"
                        title="Remove widget"
                        @click.stop="removeWidget(widget.id)"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M6 6l12 12M6 18L18 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div
                    v-if="widget.type === 'clock'"
                    class="widget-body widget-clock-body"
                  >
                    <div class="widget-clock-row">
                      <div class="widget-clock-main">
                        {{ getClockParts(clockNow).main }}
                      </div>
                      <div class="widget-clock-side">
                        <span class="widget-clock-seconds">
                          {{ getClockParts(clockNow).seconds }}
                        </span>
                        <span class="widget-clock-suffix">
                          {{ getClockParts(clockNow).suffix }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    v-else-if="widget.type === 'timer'"
                    class="widget-body edge-controls"
                  >
                    <div class="widget-timer-display">
                      <svg class="widget-timer-ring" viewBox="0 0 120 120">
                        <circle class="ring-track" cx="60" cy="60" r="44" />
                        <circle
                          class="ring-progress"
                          cx="60"
                          cy="60"
                          r="44"
                          :style="{
                            strokeDasharray: timerRingCircumference,
                            strokeDashoffset:
                              timerRingCircumference *
                              (1 - getTimerProgress(widget)),
                          }"
                        />
                      </svg>
                      <div class="widget-timer-main">
                        {{ formatDuration(widget.timer.remainingMs) }}
                      </div>
                    </div>
                    <div class="widget-timer-controls">
                      <button
                        class="widget-control-btn"
                        :title="widget.timer.running ? 'Pause' : 'Start'"
                        @click.stop="toggleTimer(widget)"
                      >
                        <svg v-if="!widget.timer.running" viewBox="0 0 24 24">
                          <path d="M6 4l14 8-14 8z" />
                        </svg>
                        <svg v-else viewBox="0 0 24 24">
                          <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                        </svg>
                      </button>
                      <button
                        class="widget-control-btn"
                        title="Reset"
                        @click.stop="resetTimer(widget)"
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M12 6v6l4 2" />
                          <path d="M6 6a8 8 0 1 1-2 6" />
                          <path d="M3 6h4v4" />
                        </svg>
                      </button>
                      <input
                        class="widget-time-input"
                        type="text"
                        :disabled="widget.timer.running"
                        v-model="widget.timer.input"
                        @keydown.enter.prevent="applyTimerInput(widget)"
                        @blur="applyTimerInput(widget)"
                        placeholder="05:00"
                        title="Set timer (mm:ss)"
                      />
                    </div>
                  </div>
                  <div
                    v-else-if="widget.type === 'qr'"
                    class="widget-body widget-qr-body"
                  >
                    <div class="widget-qr-preview">
                      <img
                        v-if="widget.qr.dataUrl"
                        :src="widget.qr.dataUrl"
                        alt="QR code"
                      />
                      <div v-else class="widget-qr-placeholder">QR</div>
                    </div>
                    <input
                      class="widget-qr-input"
                      type="text"
                      v-model="widget.qr.text"
                      @input="scheduleQrUpdate(widget)"
                      placeholder="Paste URL"
                      title="QR text"
                    />
                  </div>
                  <div
                    v-else
                    class="widget-body widget-stopwatch-body edge-controls"
                  >
                    <div class="widget-stopwatch-main">
                      {{ formatStopwatch(widget.stopwatch.elapsedMs) }}
                    </div>
                    <div class="widget-stopwatch-controls">
                      <button
                        class="widget-control-btn"
                        :title="widget.stopwatch.running ? 'Pause' : 'Start'"
                        @click.stop="toggleStopwatch(widget)"
                      >
                        <svg
                          v-if="!widget.stopwatch.running"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 4l14 8-14 8z" />
                        </svg>
                        <svg v-else viewBox="0 0 24 24">
                          <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                        </svg>
                      </button>
                      <button
                        class="widget-control-btn"
                        title="Lap (Q)"
                        @click.stop="lapStopwatch(widget)"
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M12 6v6l4 2" />
                          <path d="M6 6h4" />
                        </svg>
                      </button>
                      <button
                        class="widget-control-btn"
                        title="Reset"
                        @click.stop="resetStopwatch(widget)"
                      >
                        <svg viewBox="0 0 24 24">
                          <path d="M12 6v6l4 2" />
                          <path d="M6 6a8 8 0 1 1-2 6" />
                          <path d="M3 6h4v4" />
                        </svg>
                      </button>
                    </div>
                    <div
                      v-if="widget.stopwatch.laps.length"
                      class="widget-laps"
                    >
                      <div
                        v-for="(lap, idx) in widget.stopwatch.laps"
                        :key="`${lap.label}-${idx}`"
                        class="widget-lap-row"
                        :class="{
                          latest: idx === widget.stopwatch.laps.length - 1,
                        }"
                      >
                        <span class="lap-label">{{ lap.label }}</span>
                        <span class="lap-times">
                          <span class="lap-total">
                            {{ formatStopwatch(lap.totalMs) }}
                          </span>
                          <span class="lap-split">
                            +{{ formatStopwatch(lap.lapMs) }}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="widget-resize-handle"
                  @pointerdown.stop="onWidgetResizeStart(widget, $event)"
                ></div>
              </div>
            </div>
            <div
              v-if="slideTransition.visible"
              class="slide-transition"
              :class="slideTransition.phase"
            ></div>
            <div v-if="isLiveBroadcasting" class="live-border"></div>
          </div>

          <div
            v-if="webcam.enabled"
            class="webcam-preview"
            :class="{
              flipped: webcam.flip,
              locked: webcam.locked,
              paused: camPaused,
            }"
            :style="{
              left: `${webcam.x}px`,
              top: `${webcam.y}px`,
              width: `${webcam.width}px`,
              height: `${webcam.height}px`,
              pointerEvents: webcam.locked ? 'none' : 'auto',
            }"
            @pointerdown.capture="onWebcamDragStart"
          >
            <video
              v-show="!webcam.chromaEnabled"
              ref="webcamVideo"
              autoplay
              playsinline
              muted
            ></video>
            <canvas
              v-show="webcam.chromaEnabled"
              ref="webcamCanvas"
              class="webcam-canvas"
            ></canvas>
            <div
              class="webcam-controls left"
              :style="{ pointerEvents: 'auto' }"
            >
              <button
                class="mini-btn"
                :class="{ active: webcam.locked }"
                @click.stop="webcam.locked = !webcam.locked"
                :title="webcam.locked ? 'Unlock position' : 'Lock position'"
              >
                <svg v-if="webcam.locked" viewBox="0 0 24 24">
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M7 11V8a5 5 0 0 1 10 0" />
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M17 11V8" />
                </svg>
              </button>
            </div>
            <div class="webcam-controls" :style="{ pointerEvents: 'auto' }">
              <button
                class="mini-btn"
                :class="{ active: webcam.locked }"
                @click.stop="webcam.locked = !webcam.locked"
                :title="webcam.locked ? 'Unlock position' : 'Lock position'"
              >
                <svg v-if="webcam.locked" viewBox="0 0 24 24">
                  <path d="M7 11V8a5 5 0 0 1 10 0v3" />
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M7 11V8a5 5 0 0 1 10 0" />
                  <rect x="5" y="11" width="14" height="9" rx="2" />
                  <path d="M17 11V8" />
                </svg>
              </button>
              <button class="mini-btn" @click.stop="toggleWebcamFlip">
                <svg viewBox="0 0 24 24">
                  <path d="M7 7h6v6H7z" />
                  <path d="M3 12a9 9 0 0 1 9-9" />
                  <path d="M21 12a9 9 0 0 1-9 9" />
                </svg>
              </button>
              <button
                class="mini-btn"
                :class="{ active: webcam.chromaEnabled }"
                @click.stop="toggleChroma"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 4v16M4 12h16" />
                  <path d="M7 7l10 10M17 7L7 17" />
                </svg>
              </button>
              <button class="mini-btn" @click.stop="toggleWebcamMinimize">
                <svg v-if="!webcam.minimized" viewBox="0 0 24 24">
                  <path
                    d="M5 5h6v2H7v4H5zM19 5v6h-2V7h-4V5zM5 19v-6h2v4h4v2zM19 19h-6v-2h4v-4h2z"
                  />
                </svg>
                <svg v-else viewBox="0 0 24 24">
                  <path d="M7 7h10v10H7z" />
                </svg>
              </button>
              <button class="mini-btn" @click.stop="toggleWebcam">
                <svg viewBox="0 0 24 24">
                  <path d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div
              class="webcam-resize-handle"
              @pointerdown.stop="onWebcamResizeStart"
              :style="{ pointerEvents: webcam.locked ? 'none' : 'auto' }"
            ></div>
          </div>

          <div v-if="showQuickToolControls" class="quick-tool-panel">
            <div class="quick-row">
              <input
                class="quick-slider"
                type="range"
                min="1"
                max="24"
                step="0.5"
                v-model.number="size"
              />
              <div class="quick-size">{{ Math.round(size) }}</div>
            </div>
            <div class="quick-colors">
              <button
                v-for="swatch in quickColors"
                :key="swatch"
                class="quick-swatch"
                :class="{ active: swatch === color }"
                :style="{ background: swatch }"
                @click="setColor(swatch)"
              ></button>
              <label class="quick-picker">
                <input type="color" v-model="color" />
              </label>
            </div>
          </div>

          <div class="bottom-toolbar bottom-dock" ref="bottomDock">
            <button
              class="tool-btn"
              :class="{ active: tool === 'pen' }"
              @click="togglePenPopover"
              title="Pen"
            >
              <svg viewBox="0 0 24 24">
                <path d="M7 17l7-7 3 3-7 7H7v-3z" />
                <path d="M14 7l2-2 4 4-2 2" />
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: tool === 'highlighter' }"
              @click="setTool('highlighter')"
              title="Highlighter"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 20h6l10-10-6-6L4 14v6z" />
                <path d="M12 6l6 6" />
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: tool === 'eraser' }"
              @click="toggleEraserPopover"
              :title="eraserTitle"
            >
              <svg viewBox="0 0 24 24">
                <path d="M4 15l7-7 6 6-7 7H4v-6z" />
                <path d="M12 21h8" />
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: tool === 'laser' }"
              @click="setTool('laser')"
              title="Laser"
            >
              <svg viewBox="0 0 24 24">
                <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: tool === 'shape' }"
              title="Shape"
              @click="toggleShapePopover"
              ref="shapeToolBtn"
            >
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="8" height="8" rx="1" />
                <circle cx="17" cy="15" r="4" />
              </svg>
            </button>

            <div class="dock-divider horizontal"></div>

            <button
              class="tool-btn"
              :class="{ active: showTemplatePopover }"
              title="Templates"
              @click="toggleTemplatePopover"
            >
              <svg viewBox="0 0 24 24">
                <rect x="4" y="4" width="7" height="7" rx="1" />
                <rect x="13" y="4" width="7" height="7" rx="1" />
                <rect x="4" y="13" width="7" height="7" rx="1" />
                <rect x="13" y="13" width="7" height="7" rx="1" />
              </svg>
            </button>
            <button
              class="tool-btn"
              :class="{ active: showWidgetPopover }"
              title="Widgets"
              @click="toggleWidgetPopover"
            >
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <path d="M12 7v5l3 2" />
              </svg>
            </button>
            <div class="dock-divider horizontal"></div>
            <button
              class="tool-btn"
              title="Clone Selection"
              @click="cloneSelection"
            >
              <svg viewBox="0 0 24 24">
                <rect x="7" y="7" width="10" height="10" rx="1" />
                <rect x="4" y="4" width="10" height="10" rx="1" />
              </svg>
            </button>
          </div>

          <div class="bottom-toolbar right-dock">
            <button class="icon-btn" title="Add Slide" @click="addSlide">
              <svg viewBox="0 0 24 24">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
            <button class="icon-btn" title="Previous Slide" @click="prevSlide">
              <svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button
              class="slide-index slide-index-btn"
              title="Slides"
              @click="toggleSlides"
            >
              {{ currentSlideIndex + 1 }} / {{ slides.length }}
            </button>
            <button class="icon-btn" title="Next Slide" @click="nextSlide">
              <svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" /></svg>
            </button>
            <button
              class="icon-btn"
              title="Delete Slide"
              @click="deleteSlide(currentSlideIndex)"
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 7h12l-1 14H7L6 7zm4-3h4l1 2H9l1-2z" />
              </svg>
            </button>
            <div v-if="isLiveBroadcasting" class="live-pill">
              <span class="live-dot"></span>
              LIVE
            </div>
            <div v-if="isLiveBroadcasting" class="live-meters">
              <span class="live-meter">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="4" y="5" width="16" height="12" rx="2" />
                  <path d="M9 10l6 3-6 3z" />
                </svg>
                {{ liveBitrateKbps }} kbps
              </span>
              <span class="live-meter">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3a3 3 0 0 1 3 3v6a3 3 0 1 1-6 0V6a3 3 0 0 1 3-3z"
                  />
                  <path d="M5 12a7 7 0 0 0 14 0" />
                  <path d="M12 19v2" />
                </svg>
                {{
                  liveAudioMeterStatus === "active"
                    ? `${liveAudioBitrateKbps} kbps`
                    : "n/a"
                }}
              </span>
            </div>
          </div>

          <div v-if="pdfImportStatus.active" class="status-overlay">
            <div
              class="status-dialog"
              :class="{ error: pdfImportStatus.error }"
            >
              <div class="status-title">Importing PDF</div>
              <div class="status-message">{{ pdfImportStatus.message }}</div>
              <div v-if="pdfImportStatus.total" class="status-progress">
                <div class="status-bar">
                  <span
                    :style="{
                      width: `${Math.round(
                        (pdfImportStatus.current / pdfImportStatus.total) * 100,
                      )}%`,
                    }"
                  ></span>
                </div>
                <div class="status-meta">
                  {{ pdfImportStatus.current }} / {{ pdfImportStatus.total }}
                </div>
              </div>
              <button
                v-if="!pdfImportStatus.error && !pdfImportStatus.cancelled"
                class="mini-btn"
                @click="cancelPdfImport"
              >
                Cancel
              </button>
              <button
                v-if="pdfImportStatus.error || pdfImportStatus.cancelled"
                class="mini-btn"
                @click="pdfImportStatus.active = false"
              >
                Close
              </button>
            </div>
          </div>

          <div
            v-if="state.selectionIds.length"
            class="selection-toolbar"
            :style="selectionToolbarStyle"
          >
            <span class="selection-count"
              >{{ state.selectionIds.length }} selected</span
            >
            <div v-if="selectionHasIcons" class="selection-style">
              <button class="icon-btn color-btn" title="Fill color">
                <svg viewBox="0 0 24 24">
                  <path d="M4 19h16v2H4z" />
                  <path d="M7 5l5-3 5 3v6a5 5 0 1 1-10 0V5z" />
                </svg>
                <span
                  class="color-dot"
                  :style="{ background: selectedIconFill }"
                ></span>
                <input
                  type="color"
                  :value="selectedIconFill"
                  @input="handleIconFillChange($event.target.value)"
                />
              </button>
              <button class="icon-btn color-btn" title="Stroke color">
                <svg viewBox="0 0 24 24">
                  <path d="M5 19h14" />
                  <path d="M8 5h8l2 8H6l2-8z" />
                </svg>
                <span
                  class="color-dot"
                  :style="{ background: selectedIconStroke }"
                ></span>
                <input
                  type="color"
                  :value="selectedIconStroke"
                  @input="handleIconStrokeChange($event.target.value)"
                />
              </button>
            </div>
            <button class="icon-btn" title="Duplicate" @click="cloneSelection">
              <svg viewBox="0 0 24 24">
                <path d="M8 8h12v12H8V8zM4 4h12v12H4V4z" />
              </svg>
            </button>
            <button class="icon-btn" title="Delete" @click="deleteSelection">
              <svg viewBox="0 0 24 24">
                <path d="M6 7h12l-1 14H7L6 7zm4-3h4l1 2H9l1-2z" />
              </svg>
            </button>
            <button
              class="icon-btn"
              title="Clear Selection"
              @click="clearSelection"
            >
              <svg viewBox="0 0 24 24">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          <div
            class="popover tool-popover pen-popover"
            :class="{ hidden: !showPenPopover }"
          >
            <div class="popover-header">
              <span>Pen</span>
              <button class="close-btn" @click="showPenPopover = false">
                &times;
              </button>
            </div>
            <div class="popover-row">
              <input
                class="popover-slider"
                type="range"
                min="1"
                max="20"
                step="0.5"
                v-model.number="size"
              />
              <div class="size-stepper">
                <button class="step-btn" @click="nudgeSize(-1, 1, 20)">
                  -
                </button>
                <span>{{ Math.round(size) }}</span>
                <button class="step-btn" @click="nudgeSize(1, 1, 20)">+</button>
              </div>
            </div>
            <div class="dot-row">
              <button
                v-for="dot in penPresetSizes"
                :key="`pen-${dot}`"
                class="dot-btn"
                :class="{ active: Math.round(size) === dot }"
                @click="setSize(dot)"
              >
                <span :style="{ width: `${dot}px`, height: `${dot}px` }"></span>
              </button>
            </div>
            <div class="mode-grid">
              <button
                class="mode-card"
                :class="{ active: tool === 'pen' }"
                @click="setPenMode('pen')"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M4 20l10-10 4 4-6 6H4v-4zM14 6l2-2 4 4-2 2-4-4z" />
                </svg>
                <span>Pencil</span>
              </button>
              <button
                class="mode-card"
                :class="{ active: tool === 'highlighter' }"
                @click="setPenMode('highlighter')"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M4 20l6-6 4 4-6 6H4v-4zm6-6L16 8l3 3-6 6-3-3z" />
                </svg>
                <span>Brush</span>
              </button>
              <button
                class="mode-card"
                :class="{ active: tool === 'laser' }"
                @click="setPenMode('laser')"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
                </svg>
                <span>Laser</span>
              </button>
            </div>
            <div class="color-grid">
              <div
                v-for="swatch in colors"
                :key="`pen-${swatch}`"
                class="color-swatch"
                :class="{ active: swatch === color }"
                :style="{ background: swatch }"
                @click="setColor(swatch)"
              ></div>
              <button class="color-add" title="Add color" disabled>+</button>
            </div>
          </div>

          <div
            class="popover tool-popover eraser-popover"
            :class="{ hidden: !showEraserPopover }"
          >
            <div class="popover-header">
              <span>Free Erase</span>
              <button class="close-btn" @click="showEraserPopover = false">
                &times;
              </button>
            </div>
            <div class="popover-row">
              <input
                class="popover-slider"
                type="range"
                min="6"
                max="80"
                step="1"
                v-model.number="size"
              />
              <div class="size-stepper">
                <button class="step-btn" @click="nudgeSize(-2, 6, 80)">
                  -
                </button>
                <span>{{ Math.round(size) }}</span>
                <button class="step-btn" @click="nudgeSize(2, 6, 80)">+</button>
              </div>
            </div>
            <div class="mode-grid eraser-modes">
              <button
                class="mode-card"
                :class="{ active: eraserMode === 'pixel' }"
                @click="setEraserMode('pixel')"
              >
                <svg viewBox="0 0 24 24">
                  <path d="M7 12l5-5 5 5-5 5-5-5z" />
                </svg>
                <span>Free</span>
              </button>
              <button
                class="mode-card"
                :class="{ active: eraserMode === 'area' }"
                @click="setEraserMode('area')"
              >
                <svg viewBox="0 0 24 24"><path d="M5 12l3 3 8-8" /></svg>
                <span>Element</span>
              </button>
              <button class="mode-card" disabled>
                <svg viewBox="0 0 24 24"><path d="M12 4a8 8 0 1 0 8 8" /></svg>
                <span>Lasso</span>
              </button>
            </div>
          </div>

          <div
            class="popover color-popover left-dock-popover"
            :class="{ hidden: !showColorPopover }"
          >
            <div class="popover-header">
              <span>Fill Colour</span>
              <button class="close-btn" @click="showColorPopover = false">
                &times;
              </button>
            </div>
            <div class="color-grid">
              <div
                v-for="swatch in colors"
                :key="swatch"
                class="color-swatch"
                :class="{ active: swatch === color }"
                :style="{ background: swatch }"
                @click="setColor(swatch)"
              ></div>
            </div>
            <div class="popover-footer">
              <button class="mini-btn" @click="setSize(4)">+</button>
              <button class="mini-btn" @click="setSize(8)">+</button>
              <button class="mini-btn" @click="setSize(12)">+</button>
              <button class="mini-btn" @click="setSize(16)">+</button>
            </div>
          </div>

          <div
            class="popover shape-popover"
            :class="{ hidden: !showShapePopover }"
            :style="shapePopoverStyle"
            ref="shapePopoverRef"
          >
            <div class="popover-header">
              <span>Shapes</span>
              <button class="close-btn" @click="showShapePopover = false">
                &times;
              </button>
            </div>
            <div class="popover-tabs">
              <button
                class="tab-btn"
                :class="{ active: shapeTab === 'shapes' }"
                @click="shapeTab = 'shapes'"
              >
                Shapes
              </button>
              <button
                class="tab-btn"
                :class="{ active: shapeTab === 'icons' }"
                @click="shapeTab = 'icons'"
              >
                Icons
              </button>
            </div>
            <div class="shape-layout">
              <div v-if="shapeTab === 'shapes'" class="shape-panel">
                <div class="shape-grid">
                  <button
                    class="shape-btn"
                    :class="{ active: shapeType === 'line' }"
                    @click="setShape('line')"
                    title="Line"
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M5 19L19 5" />
                    </svg>
                  </button>
                  <button
                    class="shape-btn"
                    :class="{ active: shapeType === 'rect' }"
                    @click="setShape('rect')"
                    title="Rectangle"
                  >
                    <svg viewBox="0 0 24 24">
                      <rect x="5" y="6" width="14" height="12" rx="2" />
                    </svg>
                  </button>
                  <button
                    class="shape-btn"
                    :class="{ active: shapeType === 'ellipse' }"
                    @click="setShape('ellipse')"
                    title="Ellipse"
                  >
                    <svg viewBox="0 0 24 24">
                      <ellipse cx="12" cy="12" rx="7" ry="5" />
                    </svg>
                  </button>
                </div>
              </div>
              <div v-else class="icon-panel">
                <IconPicker
                  :icons="ICON_LIBRARY"
                  @select="handleIconSelect"
                  @close="showShapePopover = false"
                />
              </div>
            </div>
          </div>

          <div
            class="popover template-popover"
            :class="{ hidden: !showTemplatePopover }"
          >
            <div class="popover-header">
              <span>Templates</span>
              <button class="close-btn" @click="showTemplatePopover = false">
                &times;
              </button>
            </div>
            <div class="template-tabs">
              <button
                class="tab-btn"
                :class="{ active: templateTab === 'default' }"
                @click="templateTab = 'default'"
              >
                Default
              </button>
              <button
                class="tab-btn"
                :class="{ active: templateTab === 'custom' }"
                @click="templateTab = 'custom'"
              >
                Custom
              </button>
            </div>
            <div class="template-grid">
              <template v-if="templateTab === 'default'">
                <button
                  v-for="tpl in defaultTemplates"
                  :key="tpl.id"
                  class="template-btn"
                  :style="{ backgroundImage: `url(${tpl.preview})` }"
                  @click="applyTemplate(tpl)"
                >
                  <span>{{ tpl.label }}</span>
                </button>
              </template>
              <template v-else>
                <button
                  class="template-btn template-upload"
                  @click="triggerTemplateUpload"
                >
                  <span>Upload</span>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 5v10M7 10l5-5 5 5" />
                    <path d="M5 19h14" />
                  </svg>
                </button>
                <button
                  v-for="tpl in customTemplates"
                  :key="tpl.id"
                  class="template-btn"
                  :style="{ backgroundImage: `url(${tpl.preview})` }"
                  @click="applyTemplate(tpl)"
                >
                  <span>{{ tpl.label }}</span>
                </button>
              </template>
            </div>
          </div>

          <div
            class="popover widget-popover"
            :class="{ hidden: !showWidgetPopover }"
          >
            <div class="popover-header">
              <span>Widgets</span>
              <button class="close-btn" @click="showWidgetPopover = false">
                &times;
              </button>
            </div>
            <div class="widget-grid">
              <button class="widget-option" @click="addWidget('clock')">
                <span class="widget-option-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                </span>
                <span class="widget-option-text">
                  <strong>Clock</strong>
                  <span>Live time overlay</span>
                </span>
              </button>
              <button class="widget-option" @click="addWidget('timer')">
                <span class="widget-option-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="13" r="7" />
                    <path d="M9 3h6" />
                    <path d="M12 10v4l3 2" />
                  </svg>
                </span>
                <span class="widget-option-text">
                  <strong>Timer</strong>
                  <span>Countdown with controls</span>
                </span>
              </button>
              <button class="widget-option" @click="addWidget('stopwatch')">
                <span class="widget-option-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="13" r="7" />
                    <path d="M9 3h6" />
                    <path d="M12 9v5" />
                  </svg>
                </span>
                <span class="widget-option-text">
                  <strong>Stopwatch</strong>
                  <span>Lap as Q1, Q2…</span>
                </span>
              </button>
              <button class="widget-option" @click="addWidget('qr')">
                <span class="widget-option-icon">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="4" y="4" width="6" height="6" />
                    <rect x="14" y="4" width="6" height="6" />
                    <rect x="4" y="14" width="6" height="6" />
                    <path d="M14 14h3v3h-3zM18 18h2" />
                  </svg>
                </span>
                <span class="widget-option-text">
                  <strong>QR code</strong>
                  <span>Share a URL</span>
                </span>
              </button>
            </div>
          </div>

          <div
            class="popover settings-popover left-dock-popover"
            :class="{ hidden: !showSettingsPopover }"
          >
            <div class="popover-header">
              <span>Settings</span>
              <button class="close-btn" @click="showSettingsPopover = false">
                &times;
              </button>
            </div>
            <div class="settings-body">
              <div class="settings-tabs">
                <button
                  class="settings-tab"
                  :class="{ active: settingsTab === 'io' }"
                  @click="settingsTab = 'io'"
                >
                  Import / Export
                </button>
                <button
                  class="settings-tab"
                  :class="{ active: settingsTab === 'recording' }"
                  @click="settingsTab = 'recording'"
                >
                  Recording
                </button>
              </div>
                <div v-if="settingsTab === 'io'" class="settings-pane">
                <div class="settings-section">
                  <div class="settings-section-title">Import</div>
                  <button class="settings-card" @click="triggerImport">
                    <span class="settings-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 4v10" />
                        <path d="M7 9l5 5 5-5" />
                        <path d="M5 20h14" />
                      </svg>
                    </span>
                    <span class="settings-text">
                      <strong>Import JSON</strong>
                      <span>Open a saved deck</span>
                    </span>
                  </button>
                  <button class="settings-card" @click="triggerPdfImport">
                    <span class="settings-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 4h8l4 4v12a2 2 0 0 1-2 2H6" />
                        <path d="M14 4v4h4" />
                        <path d="M8 14h8M8 17h5" />
                      </svg>
                    </span>
                    <span class="settings-text">
                      <strong>Import PDF</strong>
                      <span>Convert pages to slides</span>
                    </span>
                  </button>
                </div>
                <div class="settings-section">
                  <div class="settings-section-title">Export</div>
                  <button class="settings-card" @click="exportJson">
                    <span class="settings-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20V10" />
                        <path d="M7 15l5-5 5 5" />
                        <path d="M5 4h14" />
                      </svg>
                    </span>
                    <span class="settings-text">
                      <strong>Export JSON</strong>
                      <span>Share editable slides</span>
                    </span>
                  </button>
                  <button class="settings-card" @click="exportPng">
                    <span class="settings-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <rect x="4" y="5" width="16" height="14" rx="2" />
                        <path d="M8 15l3-3 3 3 2-2 2 2" />
                      </svg>
                    </span>
                    <span class="settings-text">
                      <strong>Export PNG</strong>
                      <span>Snapshot this slide</span>
                    </span>
                  </button>
                  <button class="settings-card" @click="exportPdf">
                    <span class="settings-icon">
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M6 4h8l4 4v12a2 2 0 0 1-2 2H6" />
                        <path d="M14 4v4h4" />
                        <path d="M8 14h8M8 17h6" />
                      </svg>
                    </span>
                    <span class="settings-text">
                      <strong>Export PDF</strong>
                      <span>Full deck as PDF</span>
                    </span>
                  </button>
                </div>
              </div>
                <div v-else class="settings-pane">
                  <div class="settings-section">
                    <div class="settings-section-title">Recording</div>
                  <div class="recording-controls">
                    <label>
                      FPS
                      <select v-model.number="recordingSettings.fps">
                        <option :value="15">15</option>
                        <option :value="30">30</option>
                        <option :value="60">60</option>
                      </select>
                    </label>
                    <label>
                      Video Mbps
                      <select v-model.number="recordingSettings.videoMbps">
                        <option :value="1.5">1.5</option>
                        <option :value="3">3</option>
                        <option :value="5">5</option>
                        <option :value="8">8</option>
                        <option :value="10">10</option>
                        <option :value="12">12</option>
                      </select>
                    </label>
                    <div class="recording-folder-row">
                      <button class="mini-btn" @click="pickRecordingFolder">
                        Choose folder
                      </button>
                      <span class="recording-folder-status">
                        {{ recordingDirHandle ? "Folder set" : "No folder" }}
                      </span>
                    </div>
                  </div>
                    <div class="recording-controls">
                      <label class="toggle">
                        <input
                          type="checkbox"
                          v-model="audacitySyncEnabled"
                          :disabled="!audacityBridgeUrl"
                        />
                        <span>Audacity sync</span>
                      </label>
                    <span
                      v-if="audacityBridgeUrl"
                      class="audacity-status-text"
                      :class="audacityStatus.state"
                    >
                      {{ audacityStatus.text }}
                    </span>
                    <span v-else class="audacity-status-text missing">
                      Set VITE_AUDACITY_BRIDGE_URL
                    </span>
                  </div>
                    <div class="recording-actions">
                      <button class="pill-btn" @click="toggleRecordings">
                        {{ isRecording ? "Stop" : "Start" }}
                      </button>
                      <button
                        class="pill-btn ghost"
                        :class="{ active: audacityRecording }"
                        :disabled="!audacityBridgeUrl"
                        @click="toggleAudacityRecording"
                      >
                        {{ audacityRecording ? "Stop Audacity" : "Start Audacity" }}
                      </button>
                    </div>
                  </div>
                <div class="settings-section">
                  <div class="settings-section-title">Live</div>
                  <div class="live-controls">
                    <div class="live-row">
                      <label>Relay WS</label>
                      <input
                        class="live-input"
                        v-model="liveRelayUrl"
                        placeholder="ws://localhost:6060"
                      />
                    </div>
                    <div class="live-row">
                      <label>RTMP URL</label>
                      <input
                        class="live-input"
                        v-model="liveRtmpUrl"
                        placeholder="rtmp://a.rtmp.youtube.com/live2"
                      />
                    </div>
                    <div class="live-row">
                      <label>Stream Key</label>
                      <input
                        class="live-input"
                        type="password"
                        v-model="liveStreamKey"
                        placeholder="xxxx-xxxx-xxxx-xxxx"
                      />
                    </div>
                    <div class="live-status">
                      <span>
                        Live: {{ liveStatus }} • {{ liveBitrateKbps }} kbps
                      </span>
                      <button
                        class="pill-btn"
                        :class="{ danger: isLiveBroadcasting }"
                        @click="toggleLiveBroadcast"
                      >
                        {{ isLiveBroadcasting ? "Stop Live" : "Go Live" }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="showPrestart" class="prestart-backdrop">
            <div class="prestart-modal">
              <div class="prestart-header">
                <strong>Pre-Start Config</strong>
                <button class="close-btn" @click="closePrestart">
                  &times;
                </button>
              </div>
              <div class="prestart-body">
                <div class="prestart-row">
                  <span>Camera</span>
                  <button class="pill-btn ghost" @click="toggleCamera">
                    {{ avControls.cameraEnabled ? "On" : "Off" }}
                  </button>
                </div>
                <div class="prestart-row">
                  <span>Microphone</span>
                  <button class="pill-btn ghost" @click="toggleMic">
                    {{ avControls.micEnabled ? "On" : "Off" }}
                  </button>
                </div>
                <label class="prestart-label">
                  Camera Device
                  <select
                    v-model="precheck.cameraId"
                    @change="handleCameraDeviceChange"
                    @focus="ensureAvPermissions"
                  >
                    <option value="">Default</option>
                    <option
                      v-for="(dev, idx) in cameras"
                      :key="dev.deviceId"
                      :value="dev.deviceId"
                    >
                      {{ dev.label || `Camera ${idx + 1}` }}
                    </option>
                  </select>
                </label>
                <label class="prestart-label">
                  Microphone Device
                  <select
                    v-model="precheck.micId"
                    @change="handleMicDeviceChange"
                    @focus="ensureAvPermissions"
                  >
                    <option value="">Default</option>
                    <option
                      v-for="(dev, idx) in microphones"
                      :key="dev.deviceId"
                      :value="dev.deviceId"
                    >
                      {{ dev.label || `Mic ${idx + 1}` }}
                    </option>
                  </select>
                </label>
              </div>
              <div class="prestart-actions">
                <button class="pill-btn ghost" @click="closePrestart">
                  Cancel
                </button>
                <button class="pill-btn primary" @click="confirmPrestart">
                  Start Class
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="slides-panel" :class="{ hidden: !showSlidesPanel }">
        <div class="slides-header">
          <h3>Slides</h3>
          <button class="ghost-btn" @click="showSlidesPanel = false">
            &times;
          </button>
        </div>
        <div class="slides-controls">
          <label><input type="checkbox" /> Select All</label>
          <label><input type="checkbox" /> Multi-Select</label>
        </div>
        <div class="slides-list">
          <div
            v-for="(slide, index) in slides"
            :key="slide.id"
            class="slide-card"
            :class="{ active: index === currentSlideIndex }"
            @click="switchSlide(index)"
            draggable="true"
            @dragstart="onDragStart($event, index)"
            @dragover.prevent="onDragOver(index)"
            @drop.prevent="onDrop(index)"
          >
            <div
              class="slide-thumb"
              :style="
                slide.thumb
                  ? { backgroundImage: `url(${slide.thumb})` }
                  : undefined
              "
            ></div>
            <div class="slide-number">{{ index + 1 }}</div>
            <button
              class="slide-delete"
              title="Delete slide"
              @click.stop="deleteSlide(index)"
            >
              &times;
            </button>
          </div>
          <div class="slide-add" @click="addSlide">+</div>
        </div>
      </aside>
    </main>
  </div>
</template>

<script setup>
import {
  onMounted,
  onBeforeUnmount,
  ref,
  reactive,
  computed,
  watch,
  nextTick,
} from "vue";
import { openDB } from "idb";
import bootstrapIconsSprite from "bootstrap-icons/bootstrap-icons.svg?raw";
import IconPicker from "@/components/IconPicker.vue";
import {
  STROKE_TYPES,
  SHAPE_TYPES,
  TRANSFORM_MODES,
  SELECTION_MODES,
  SCALE_HANDLES,
} from "@/utils/constants.js";
import { SelectorTool } from "@/utils/selectorTool.js";
import {
  migrateIconShapes,
  migrateDeck,
  validateStroke,
} from "@/utils/migration.js";

let pdfjsPromise = null;
let pdfWorkerUrlPromise = null;
let jsPdfPromise = null;

async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf");
  }
  if (!pdfWorkerUrlPromise) {
    pdfWorkerUrlPromise = import("pdfjs-dist/legacy/build/pdf.worker?url").then(
      (mod) => mod.default,
    );
  }
  const [pdfjsLib, pdfWorkerUrl] = await Promise.all([
    pdfjsPromise,
    pdfWorkerUrlPromise,
  ]);
  return { pdfjsLib, pdfWorkerUrl };
}

async function loadJsPdf() {
  if (!jsPdfPromise) {
    jsPdfPromise = import("jspdf");
  }
  return jsPdfPromise;
}

const templateAssetModules = import.meta.glob(
  "./assets/templates/*.{png,jpg,jpeg,webp}",
  { eager: true, import: "default" },
);
const SLIDE_TRANSITION_ENABLED =
  import.meta.env.VITE_SLIDE_TRANSITION !== "false";

const zoomLabel = "2.95";
const validRoutes = new Set(["/", "/class", "/recordings"]);
const routePath = ref(
  validRoutes.has(window.location.pathname) ? window.location.pathname : "/",
);
const colors = [
  "#ffffff",
  "#111111",
  "#ff4757",
  "#ff7f50",
  "#ffdd59",
  "#2ed573",
  "#1e90ff",
  "#5352ed",
  "#a55eea",
  "#f368e0",
  "#2f3542",
  "#70a1ff",
  "#00d2d3",
  "#ff9f43",
  "#eccc68",
  "#ff6b81",
];

const ICON_VIEWBOX = 16;
const iconPathCache = new Map();

function buildBootstrapIconLibrary(rawSvg) {
  if (!rawSvg) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawSvg, "image/svg+xml");
  const symbols = Array.from(doc.querySelectorAll("symbol"));
  return symbols
    .map((sym) => {
      const id = sym.getAttribute("id");
      const label = (id || "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase());
      const paths = Array.from(sym.querySelectorAll("path"))
        .map((node) => node.getAttribute("d"))
        .filter(Boolean);
      if (!id || !paths.length) return null;
      return { id, label, paths };
    })
    .filter(Boolean);
}

const ICON_LIBRARY = buildBootstrapIconLibrary(bootstrapIconsSprite);

function getIconById(iconId) {
  return ICON_LIBRARY.find((icon) => icon.id === iconId) || ICON_LIBRARY[0];
}

function getIconPaths(iconId) {
  if (iconPathCache.has(iconId)) return iconPathCache.get(iconId);
  const icon = getIconById(iconId);
  if (!icon) return [];
  const paths = icon.paths.map((d) => new Path2D(d));
  iconPathCache.set(iconId, paths);
  return paths;
}

function drawIconShape(ctx, iconId, rect, stroke) {
  const paths = getIconPaths(iconId);
  if (!paths.length) {
    console.warn("No paths found for icon:", iconId);
    return;
  }
  const scaleX = rect.w / ICON_VIEWBOX;
  const scaleY = rect.h / ICON_VIEWBOX;
  ctx.save();
  ctx.translate(rect.x, rect.y);
  ctx.scale(scaleX || 1, scaleY || 1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, stroke.size / Math.max(scaleX, scaleY));
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.fillColor || "transparent";
  ctx.globalAlpha = stroke.alpha;
  ctx.globalCompositeOperation = "source-over";
  if (stroke.fillColor) {
    paths.forEach((path) => ctx.fill(path));
  }
  paths.forEach((path) => ctx.stroke(path));
  ctx.restore();
}

const TOOL_DEFAULTS = {
  select: { size: 0, alpha: 1, composite: "source-over" },
  pointer: { size: 0, alpha: 1, composite: "source-over" },
  pen: { size: 3.5, alpha: 1, composite: "source-over" },
  highlighter: { size: 12, alpha: 0.35, composite: "source-over" },
  eraser: { size: 22, alpha: 1, composite: "destination-out" },
  laser: { size: 6, alpha: 1, composite: "source-over" },
  shape: { size: 3, alpha: 1, composite: "source-over" },
  fill: { size: 0, alpha: 1, composite: "source-over" },
};

const tool = ref("pen");
const color = ref("#ffffff");
const size = ref(TOOL_DEFAULTS.pen.size);
const showColorPopover = ref(false);
const showShapePopover = ref(false);
const showTemplatePopover = ref(false);
const showWidgetPopover = ref(false);
const showPenPopover = ref(false);
const showEraserPopover = ref(false);
const showSettingsPopover = ref(false);
const showSlidesPanel = ref(false);
const shapeType = ref("rect");
const activeIcon = ref(ICON_LIBRARY[0]?.id || "star");
const shapeTab = ref("shapes");
const eraserMode = ref("pixel");
const pdfImportStatus = ref({
  active: false,
  message: "",
  current: 0,
  total: 0,
  error: false,
  cancelled: false,
});
let pdfRenderTask = null;
let pdfImportAbort = false;
const PDF_RENDER_SCALE = 1;
const PDF_RENDER_MAX_DIM = 4096;
const recordingSearch = ref("");
const recordingView = ref("list");
const templateTab = ref("default");

const canvasStack = ref(null);
const inkCanvas = ref(null);
const backgroundCanvas = ref(null);
const overlayCanvas = ref(null);
const shapeToolBtn = ref(null);
const shapePopoverRef = ref(null);
const shapePopoverSize = ref({ width: 320, height: 240 });
const viewportSize = ref({
  width: window.innerWidth,
  height: window.innerHeight,
});
const boardStage = ref(null);
const bottomDock = ref(null);
const leftDock = ref(null);
const importInput = ref(null);
const pdfInput = ref(null);
const templateInput = ref(null);

const slides = ref([]);
const currentSlideIndex = ref(0);

const inkCtx = ref(null);
const bgCtx = ref(null);
const overlayCtx = ref(null);
let recordCanvas = null;
let recordCtx = null;
const strokeCounter = ref(0);
const bgImageCache = new Map();
const draggedSlideIndex = ref(null);

const templates = ref([]);
const currentTemplate = ref(null);
const settingsTab = ref("io");
const isRecording = ref(false);
const recordings = ref([]);
const recordingSettings = ref({ fps: 60, videoMbps: 12 });
const recordingSaveToDisk = ref(false);
const recordingDirHandle = ref(null);
let recordingFileHandle = null;
let recordingFileStream = null;
let lastRecordingFileHandle = null;
let recordingWriteChain = null;
let recordingWriteFailed = false;
const recordingSaveStatus = ref("");
const isLiveBroadcasting = ref(false);
const liveStatus = ref("Idle");
const liveRelayUrl = ref(
  import.meta.env.VITE_LIVE_RELAY_URL || "ws://localhost:6060",
);
const liveRtmpUrl = ref(
  import.meta.env.VITE_LIVE_RTMP_URL || "rtmp://a.rtmp.youtube.com/live2",
);
const liveStreamKey = ref("");
let liveSocket = null;
let liveRecorder = null;
let liveStream = null;
let liveStopTimer = null;
let liveAudioStream = null;
let liveSilentContext = null;
let liveOwnsAudio = false;
let liveAudioContext = null;
let liveAudioDestination = null;
let liveAudioSource = null;
let liveAudioGain = null;
let liveBytesSent = 0;
let liveMeterTimer = null;
const liveBitrateKbps = ref(0);
let liveAudioBytesSent = 0;
let liveAudioMeterRecorder = null;
const liveAudioBitrateKbps = ref(0);
const liveAudioMeterStatus = ref("active");
const widgets = ref([]);
const activeWidgetId = ref(null);
const clockNow = ref(new Date());
let widgetTickInterval = null;
let widgetDragState = null;
let widgetResizeState = null;
const audacityBridgeUrl = import.meta.env.VITE_AUDACITY_BRIDGE_URL || "";
const audacitySyncEnabled = ref(false);
const audacityStatus = ref({ state: "off", text: "Sync off" });
const audacityRecording = ref(false);
let audacityHealthTimer = null;
let audacitySyncWarned = false;
const TIMER_RING_RADIUS = 44;
const timerRingCircumference = 2 * Math.PI * TIMER_RING_RADIUS;
const WIDGET_MIN_WIDTH = 180;
const WIDGET_MIN_HEIGHT = 110;
let qrLibPromise = null;
const qrImageCache = new Map();
const widgetDomRefs = new Map();
const widgetSnapshotCache = new Map();
const toast = reactive({
  visible: false,
  message: "",
  type: "info",
  actionLabel: "",
  action: null,
});
const recordingUrls = new Map();
const previewRecording = ref(null);
const penPresetSizes = [2, 4, 6, 8, 12, 16];
const defaultTemplates = computed(() =>
  templates.value.filter((tpl) => !tpl.uploaded),
);
const customTemplates = computed(() =>
  templates.value.filter((tpl) => tpl.uploaded),
);
const showQuickToolControls = computed(() =>
  ["pen", "highlighter", "laser"].includes(tool.value),
);
const quickColors = computed(() => colors.slice(0, 5));
const cameras = ref([]);
const microphones = ref([]);
const precheck = reactive({
  cameraId: "",
  micId: "",
});
const micConstraints = computed(() => ({
  deviceId: precheck.micId ? { exact: precheck.micId } : undefined,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
}));
const avControls = reactive({
  cameraEnabled: false,
  cameraMuted: false,
  micEnabled: false,
});
const webcam = reactive({
  enabled: false,
  wasEnabled: false,
  stream: null,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  flip: true,
  minimized: false,
  prevWidth: 0,
  prevHeight: 0,
  aspect: 16 / 9,
  userPlaced: false,
  chromaEnabled: true,
  chromaColor: "#00ff00",
  chromaTolerance: 0.22,
  chromaSoftness: 0.14,
  locked: false,
  dragging: false,
  dragOffsetX: 0,
  dragOffsetY: 0,
  resizing: false,
  resizeStartX: 0,
  resizeStartY: 0,
  resizeStartW: 0,
  resizeStartH: 0,
});
const webcamVideo = ref(null);
const webcamCanvas = ref(null);
let recordingRaf = null;
let webcamRaf = null;
let recordingTimer = null;
let recordingBaseMs = 0;
const recordingStartTs = ref(null);
const recordingElapsedMs = ref(0);
const recordingPaused = ref(false);
const hasAskedAvPermissions = ref(false);
let micPreviewStream = null;
const micLevel = ref(0);
const micPaused = ref(false);
const camPaused = ref(false);
let micMeter = null;
let micMeterInterval = null;
let livePreviewWindow = null;
let livePreviewRaf = null;
const isPreviewingRecording = ref(false);
const showPrestart = ref(false);
const RECORD_MAX_WIDTH = 2560;
const RECORD_MAX_HEIGHT = 1440;
const recordSize = reactive({ width: 1920, height: 1080 });
const LIVE_RECORD_WIDTH = 1920;
const LIVE_RECORD_HEIGHT = 1080;
const liveRecordPrevSize = { width: 0, height: 0 };
let recordCompositeCanvas = null;
let recordCompositeCtx = null;

const undoStyle = computed(() => ({
  opacity: slides.value[currentSlideIndex.value]?.history?.length ? "1" : "0.4",
}));
const redoStyle = computed(() => ({
  opacity: slides.value[currentSlideIndex.value]?.redoHistory?.length
    ? "1"
    : "0.4",
}));
const eraserTitle = computed(
  () => `Eraser (${eraserMode.value === "pixel" ? "Free" : "Element"})`,
);
const isClassRoute = computed(() => routePath.value === "/class");
const isDashboardRoute = computed(() => routePath.value === "/");
const isRecordingsRoute = computed(() => routePath.value === "/recordings");
const totalRecordingSize = computed(() =>
  recordings.value.reduce((sum, rec) => sum + (rec.size || 0), 0),
);
const recordingTimeLabel = computed(() =>
  formatDuration(recordingElapsedMs.value),
);
const filteredRecordings = computed(() => {
  const query = recordingSearch.value.trim().toLowerCase();
  if (!query) return recordings.value;
  return recordings.value.filter((rec) => {
    const name = (rec.name || "").toLowerCase();
    const created = (rec.createdAt || "").toLowerCase();
    return name.includes(query) || created.includes(query);
  });
});
const slideTransition = reactive({
  visible: false,
  phase: "",
  token: 0,
});
const selectedIconStrokes = computed(() => {
  const slide = getActiveSlide();
  if (!slide || !state.selectionIds.length) return [];
  return state.selectionIds
    .map((id) => findStrokeById(slide, id))
    .filter((stroke) => stroke && stroke.type === STROKE_TYPES.ICON);
});
const selectionHasIcons = computed(() => selectedIconStrokes.value.length > 0);
const selectedIconFill = computed(() => {
  const stroke = selectedIconStrokes.value[0];
  return stroke?.fillColor || stroke?.color || "#111111";
});
const selectedIconStroke = computed(() => {
  const stroke = selectedIconStrokes.value[0];
  return stroke?.strokeColor || "#111111";
});
const selectionToolbarStyle = computed(() => {
  if (!computedSelectionBounds.value) return {};
  const { width, height } = getCanvasSize();
  const bounds = computedSelectionBounds.value;
  const stackRect = canvasStack.value?.getBoundingClientRect();
  if (!stackRect) return {};

  // Inline with selection bounds (top-left) in viewport coords
  let x = stackRect.left + bounds.x;
  let y = stackRect.top + bounds.y - 44;

  // Keep toolbar in view
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  if (x + 220 > viewportW) x = viewportW - 220;
  if (x < 8) x = 8;

  // If too far up, place below
  if (y < 8) y = stackRect.top + bounds.bottom + 8;
  if (y + 44 > viewportH) y = viewportH - 44;

  return {
    position: "fixed",
    left: `${x}px`,
    top: `${y}px`,
  };
});

const shapePopoverStyle = computed(() => {
  if (!showShapePopover.value || !shapeToolBtn.value) return {};
  const trigger = shapeToolBtn.value.getBoundingClientRect();
  const { width: popW, height: popH } = shapePopoverSize.value;
  const margin = 8;
  const viewportW = viewportSize.value.width;
  const viewportH = viewportSize.value.height;
  let left = trigger.left;
  let top = trigger.bottom + margin;
  if (left + popW > viewportW - margin) {
    left = Math.max(margin, viewportW - popW - margin);
  }
  if (top + popH > viewportH - margin) {
    top = trigger.top - popH - margin;
  }
  if (top < margin) {
    top = Math.max(margin, viewportH - popH - margin);
  }
  return {
    position: "fixed",
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
  };
});

// Computed selection bounds - always automatically in sync with stroke positions
const computedSelectionBounds = computed(() => {
  const slide = getActiveSlide();
  if (!slide || !state.selectionIds.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    if (!stroke) return;
    const bbox = getStrokeBounds(stroke);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  });
  if (!state.selectionIds.length) return null;
  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    right: maxX,
    bottom: maxY,
  };
});

const state = {
  isDrawing: false,
  needsFlush: false,
  pendingPoints: [],
  cursor: { x: 0, y: 0, active: false },
  laserTrail: [],
  laserStart: 0,
  overlayDirty: false,
  selectionRect: null,
  selectionIds: [],
  // selectionBounds is now computed automatically (see computedSelectionBounds)
  transform: null,
  shapePreview: null,
  eraseIndexMap: null,
  erasedItems: [],
  erasedIds: null,
  recorder: null,
  recordingStream: null,
  recordingAudio: null,
};

let currentStroke = null;
let resizeObserver = null;
let saveTimeout = null;
let saveInterval = null;
let dbPromise = null;
let deckDirty = false;

const DB_NAME = "teaching-board";
const DB_VERSION = 3;
const STORE_DECK = "decks";
const STORE_RECORDINGS = "recordings";
const STORE_SETTINGS = "settings";

function normalizeRoute(path) {
  return validRoutes.has(path) ? path : "/";
}

function navigate(path) {
  const next = normalizeRoute(path);
  if (routePath.value === next) return;
  window.history.pushState(null, "", next);
  routePath.value = next;
  if (next === "/recordings") {
    loadRecordings();
  }
  if (next === "/class") {
    nextTick(() => {
      resizeCanvases();
      updateDockMetrics();
    });
  }
}

function showToast(message, type = "info", duration = 3000) {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  toast.actionLabel = "";
  toast.action = null;
  setTimeout(() => {
    toast.visible = false;
  }, duration);
}

function buildLiveRtmpUrl() {
  const base = (liveRtmpUrl.value || "").trim();
  const key = (liveStreamKey.value || "").trim();
  if (!base) return "";
  if (!key) return base;
  if (base.includes(key)) return base;
  return base.endsWith("/") ? `${base}${key}` : `${base}/${key}`;
}

function loadLiveSettings() {
  try {
    const raw = localStorage.getItem("liveBroadcastSettings");
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data?.relayUrl) liveRelayUrl.value = data.relayUrl;
    if (data?.rtmpUrl) liveRtmpUrl.value = data.rtmpUrl;
    if (data?.streamKey) liveStreamKey.value = data.streamKey;
  } catch (err) {
    console.warn("Failed to load live settings", err);
  }
}

function saveLiveSettings() {
  try {
    localStorage.setItem(
      "liveBroadcastSettings",
      JSON.stringify({
        relayUrl: liveRelayUrl.value,
        rtmpUrl: liveRtmpUrl.value,
        streamKey: liveStreamKey.value,
      }),
    );
  } catch (err) {
    console.warn("Failed to save live settings", err);
  }
}

function showActionToast(message, actionLabel, action, type = "info") {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  toast.actionLabel = actionLabel;
  toast.action = action;
}

function handleToastAction() {
  if (toast.action) toast.action();
  toast.visible = false;
}

function startLiveBitrateMeter() {
  if (liveMeterTimer) clearInterval(liveMeterTimer);
  liveBytesSent = 0;
  liveAudioBytesSent = 0;
  liveBitrateKbps.value = 0;
  liveAudioBitrateKbps.value = 0;
  liveAudioMeterStatus.value = "active";
  liveMeterTimer = setInterval(() => {
    liveBitrateKbps.value = Math.round((liveBytesSent * 8) / 1000);
    liveBytesSent = 0;
    liveAudioBitrateKbps.value = Math.round((liveAudioBytesSent * 8) / 1000);
    liveAudioBytesSent = 0;
  }, 1000);
}

function stopLiveBitrateMeter() {
  if (liveMeterTimer) clearInterval(liveMeterTimer);
  liveMeterTimer = null;
  liveBytesSent = 0;
  liveBitrateKbps.value = 0;
  liveAudioBitrateKbps.value = 0;
  liveAudioBytesSent = 0;
  liveAudioMeterStatus.value = "inactive";
}

function setLiveRecordSize(enabled) {
  if (!recordCompositeCanvas) return;
  if (enabled) {
    liveRecordPrevSize.width = recordCompositeCanvas.width;
    liveRecordPrevSize.height = recordCompositeCanvas.height;
    recordCompositeCanvas.width = LIVE_RECORD_WIDTH;
    recordCompositeCanvas.height = LIVE_RECORD_HEIGHT;
    recordSize.width = recordCompositeCanvas.width;
    recordSize.height = recordCompositeCanvas.height;
  } else {
    if (liveRecordPrevSize.width && liveRecordPrevSize.height) {
      recordCompositeCanvas.width = liveRecordPrevSize.width;
      recordCompositeCanvas.height = liveRecordPrevSize.height;
      recordSize.width = recordCompositeCanvas.width;
      recordSize.height = recordCompositeCanvas.height;
    }
  }
}

function createSilentAudioTrack() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  liveSilentContext = new AudioCtx();
  const oscillator = liveSilentContext.createOscillator();
  const gain = liveSilentContext.createGain();
  gain.gain.value = 0;
  oscillator.connect(gain);
  const dest = liveSilentContext.createMediaStreamDestination();
  gain.connect(dest);
  oscillator.start();
  return dest.stream.getAudioTracks()[0] || null;
}

async function mixLiveAudioTrack(stream) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx || !stream) return stream?.getAudioTracks?.()[0] || null;
  if (!liveAudioContext) {
    liveAudioContext = new AudioCtx();
  }
  if (liveAudioContext.state === "suspended") {
    await liveAudioContext.resume();
  }
  const source = liveAudioContext.createMediaStreamSource(stream);
  const dest = liveAudioContext.createMediaStreamDestination();
  source.connect(dest);
  return dest.stream.getAudioTracks()[0] || null;
}

async function initLiveAudioPipeline() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  if (!liveAudioContext) {
    liveAudioContext = new AudioCtx();
  }
  if (liveAudioContext.state === "suspended") {
    await liveAudioContext.resume();
  }
  if (!liveAudioDestination) {
    liveAudioDestination = liveAudioContext.createMediaStreamDestination();
  }
  if (!liveAudioGain) {
    liveAudioGain = liveAudioContext.createGain();
    liveAudioGain.gain.value = avControls.micEnabled ? 1 : 0;
    liveAudioGain.connect(liveAudioDestination);
  }
}

function attachLiveAudioSource(stream) {
  if (!liveAudioContext || !liveAudioDestination || !stream) return;
  if (liveAudioSource) {
    try {
      liveAudioSource.disconnect();
    } catch {}
  }
  liveAudioSource = liveAudioContext.createMediaStreamSource(stream);
  liveAudioSource.connect(liveAudioGain);
}

async function openLastRecording() {
  if (!lastRecordingFileHandle) return;
  try {
    const file = await lastRecordingFileHandle.getFile();
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    showToast("Failed to open recording", "error");
  }
}

async function loadRecordingDirHandle() {
  if (!("showDirectoryPicker" in window)) return;
  try {
    const db = await getDb();
    const handle = await db.get(STORE_SETTINGS, "recordingDirHandle");
    if (handle) {
      recordingDirHandle.value = handle;
    }
  } catch (err) {
    console.warn("Failed to load recording folder handle", err);
  }
}

async function saveRecordingDirHandle(handle) {
  try {
    const db = await getDb();
    await db.put(STORE_SETTINGS, handle, "recordingDirHandle");
  } catch (err) {
    console.warn("Failed to save recording folder handle", err);
  }
}

async function ensureRecordingDirHandle() {
  if (!("showDirectoryPicker" in window)) return null;
  let handle = recordingDirHandle.value;
  if (handle) {
    const perm = await handle.queryPermission({ mode: "readwrite" });
    if (perm === "granted") return handle;
    const req = await handle.requestPermission({ mode: "readwrite" });
    if (req === "granted") return handle;
  }
  handle = await window.showDirectoryPicker();
  recordingDirHandle.value = handle;
  await saveRecordingDirHandle(handle);
  return handle;
}

async function pickRecordingFolder() {
  if (!("showDirectoryPicker" in window)) {
    showToast("Folder picker not supported in this browser", "warn");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker();
    recordingDirHandle.value = handle;
    await saveRecordingDirHandle(handle);
    showToast("Recording folder set", "success");
  } catch (err) {
    showToast("Folder picker canceled", "warn");
  }
}

function openSettingsFromDashboard() {
  navigate("/class");
  nextTick(() => {
    showSettingsPopover.value = true;
  });
}

function openPrestart() {
  if (isRecording.value) {
    toggleRecordings();
    return;
  }
  showPrestart.value = true;
  loadDevices();
}

function closePrestart() {
  showPrestart.value = false;
}

function confirmPrestart() {
  showPrestart.value = false;
  toggleRecordings();
}

function selectAllStrokes() {
  const slide = getActiveSlide();
  if (!slide) return;
  state.selectionIds = slide.strokes.map((stroke) => stroke.id);
  updateSelectionBounds();
  requestOverlay();
}

function invertSelection() {
  const slide = getActiveSlide();
  if (!slide) return;
  const allIds = slide.strokes.map((stroke) => stroke.id);
  const selected = new Set(state.selectionIds);
  state.selectionIds = allIds.filter((id) => !selected.has(id));
  updateSelectionBounds();
  requestOverlay();
}

function deleteSelection() {
  const slide = getActiveSlide();
  if (!slide || !state.selectionIds.length) return;
  const items = state.selectionIds
    .map((id) => {
      const index = slide.strokes.findIndex((stroke) => stroke.id === id);
      if (index < 0) return null;
      return { stroke: slide.strokes[index], index };
    })
    .filter(Boolean);
  if (!items.length) return;
  items
    .slice()
    .sort((a, b) => b.index - a.index)
    .forEach((item) => slide.strokes.splice(item.index, 1));
  pushCommand(slide, {
    type: "remove",
    items: items.map((item) => ({ stroke: item.stroke, index: item.index })),
  });
  clearSelection();
  redrawAll();
  updateThumbnail();
  markDirty();
}

function duplicateCurrentSlide() {
  const slide = getActiveSlide();
  if (!slide) return;
  const clone = createSlide();
  clone.strokes = slide.strokes.map((stroke) => {
    const next = JSON.parse(JSON.stringify(stroke));
    if (next.type === "shape") {
      next.id = `shape-${Math.random().toString(16).slice(2)}`;
    } else {
      next.id = `stroke-${Math.random().toString(16).slice(2)}`;
    }
    return next;
  });
  clone.backgroundColor = slide.backgroundColor;
  clone.backgroundImage = slide.backgroundImage;
  clone.backgroundSize = slide.backgroundSize
    ? { ...slide.backgroundSize }
    : null;
  clone.backgroundPattern = slide.backgroundPattern
    ? { ...slide.backgroundPattern }
    : null;
  clone.backgroundBitmap = slide.backgroundBitmap || null;
  clone.thumb = slide.thumb || "";
  slides.value.splice(currentSlideIndex.value + 1, 0, clone);
  currentSlideIndex.value += 1;
  renderAllThumbnails();
  redrawAll();
  markDirty();
}

function handlePopstate() {
  routePath.value = normalizeRoute(window.location.pathname);
}

function createSlide() {
  const slide = {
    id: `slide-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    strokes: [],
    thumb: "",
    backgroundColor: "#111111",
    backgroundImage: null,
    backgroundSize: null,
    backgroundPattern: null,
    backgroundBitmap: null,
    history: [],
    redoHistory: [],
  };
  if (currentTemplate.value) {
    applyTemplateToSlide(slide, currentTemplate.value);
  }
  return slide;
}

function getActiveSlide() {
  return slides.value[currentSlideIndex.value];
}

function ensureHistory(slide) {
  if (!slide.history) slide.history = [];
  if (!slide.redoHistory) slide.redoHistory = [];
}

function pushCommand(slide, cmd) {
  ensureHistory(slide);
  slide.history.push(cmd);
  slide.redoHistory = [];
  markDirty();
}

function applyCommand(slide, cmd, direction) {
  if (!slide) return;
  const doApply = direction === "do";
  switch (cmd.type) {
    case "add": {
      if (doApply) {
        cmd.items.forEach((item) => {
          slide.strokes.splice(item.index, 0, item.stroke);
        });
      } else {
        cmd.items.forEach((item) => removeStrokeById(slide, item.stroke.id));
      }
      break;
    }
    case "remove": {
      if (doApply) {
        cmd.items.forEach((item) => removeStrokeById(slide, item.stroke.id));
      } else {
        cmd.items
          .slice()
          .sort((a, b) => a.index - b.index)
          .forEach((item) => {
            slide.strokes.splice(item.index, 0, item.stroke);
          });
      }
      break;
    }
    case "transform": {
      cmd.items.forEach((item) => {
        const stroke = findStrokeById(slide, item.id);
        if (!stroke) return;
        const snapshot = doApply ? item.after : item.before;
        applyStrokeSnapshot(stroke, snapshot);
      });
      break;
    }
    case "background": {
      slide.backgroundColor = doApply ? cmd.after.color : cmd.before.color;
      slide.backgroundImage = doApply ? cmd.after.image : cmd.before.image;
      slide.backgroundSize = doApply ? cmd.after.size : cmd.before.size;
      slide.backgroundPattern = doApply
        ? cmd.after.pattern
        : cmd.before.pattern;
      slide.backgroundBitmap = doApply ? cmd.after.bitmap : cmd.before.bitmap;
      break;
    }
    case "fill-shape": {
      const stroke = findStrokeById(slide, cmd.id);
      if (stroke) stroke.fillColor = doApply ? cmd.after : cmd.before;
      break;
    }
    case "icon-style": {
      cmd.items.forEach((item) => {
        const stroke = findStrokeById(slide, item.id);
        if (!stroke) return;
        const next = doApply ? item.after : item.before;
        stroke.fillColor = next.fillColor;
        stroke.strokeColor = next.strokeColor;
        stroke.color = next.fillColor || stroke.color;
      });
      break;
    }
    default:
      break;
  }
}

function removeStrokeById(slide, id) {
  const idx = slide.strokes.findIndex((s) => s.id === id);
  if (idx >= 0) slide.strokes.splice(idx, 1);
}

function findStrokeById(slide, id) {
  return slide.strokes.find((s) => s.id === id);
}

function applyStrokeSnapshot(stroke, snapshot) {
  if (stroke.type === STROKE_TYPES.ICON) {
    stroke.icon = snapshot.icon;
    stroke.x = snapshot.x;
    stroke.y = snapshot.y;
    stroke.width = snapshot.width;
    stroke.height = snapshot.height;
    stroke.rotation = snapshot.rotation;
    stroke.color = snapshot.color;
    stroke.fillColor = snapshot.fillColor;
    stroke.strokeColor = snapshot.strokeColor;
    stroke.alpha = snapshot.alpha;
    stroke.size = snapshot.size;
    stroke.bbox = snapshot.bbox;
  } else if (stroke.type === STROKE_TYPES.SHAPE) {
    stroke.shape = snapshot.shape;
    stroke.x = snapshot.x;
    stroke.y = snapshot.y;
    stroke.w = snapshot.w;
    stroke.h = snapshot.h;
    stroke.x2 = snapshot.x2;
    stroke.y2 = snapshot.y2;
    stroke.iconId = snapshot.iconId;
    stroke.bbox = snapshot.bbox;
  } else {
    stroke.points = snapshot.points.slice();
    stroke.bbox = snapshot.bbox;
  }
}

function getStrokeSnapshot(stroke) {
  if (stroke.type === STROKE_TYPES.ICON) {
    return {
      type: "icon",
      icon: stroke.icon,
      x: stroke.x,
      y: stroke.y,
      width: stroke.width,
      height: stroke.height,
      rotation: stroke.rotation,
      color: stroke.color,
      fillColor: stroke.fillColor,
      strokeColor: stroke.strokeColor,
      alpha: stroke.alpha,
      size: stroke.size,
      bbox: stroke.bbox ? { ...stroke.bbox } : null,
    };
  }
  if (stroke.type === STROKE_TYPES.SHAPE) {
    return {
      shape: stroke.shape,
      x: stroke.x,
      y: stroke.y,
      w: stroke.w,
      h: stroke.h,
      x2: stroke.x2,
      y2: stroke.y2,
      iconId: stroke.iconId,
      bbox: stroke.bbox ? { ...stroke.bbox } : null,
    };
  }
  return {
    points: stroke.points.slice(),
    bbox: stroke.bbox ? { ...stroke.bbox } : null,
  };
}

function normalizeRect(x0, y0, x1, y1) {
  const left = Math.min(x0, x1);
  const top = Math.min(y0, y1);
  const right = Math.max(x0, x1);
  const bottom = Math.max(y0, y1);
  return { x: left, y: top, w: right - left, h: bottom - top, right, bottom };
}

function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.right &&
    point.y >= rect.y &&
    point.y <= rect.bottom
  );
}

function rectsIntersect(a, b) {
  return !(a.right < b.x || b.right < a.x || a.bottom < b.y || b.bottom < a.y);
}

const SELECTION_HANDLE_SIZE = 8;
const SELECTION_HANDLE_HIT = 12;
const ROTATION_HANDLE_OFFSET = 22;
const ROTATION_HANDLE_RADIUS = 6;

function getSelectionHandles(bounds) {
  return [
    { id: "nw", x: bounds.x, y: bounds.y },
    { id: "ne", x: bounds.x + bounds.w, y: bounds.y },
    { id: "sw", x: bounds.x, y: bounds.y + bounds.h },
    { id: "se", x: bounds.x + bounds.w, y: bounds.y + bounds.h },
  ];
}

function getRotationHandle(bounds) {
  return {
    x: bounds.x + bounds.w / 2,
    y: bounds.y - ROTATION_HANDLE_OFFSET,
  };
}

function getHandleAnchor(bounds, handle) {
  switch (handle) {
    case "nw":
      return { x: bounds.x + bounds.w, y: bounds.y + bounds.h };
    case "ne":
      return { x: bounds.x, y: bounds.y + bounds.h };
    case "sw":
      return { x: bounds.x + bounds.w, y: bounds.y };
    case "se":
    default:
      return { x: bounds.x, y: bounds.y };
  }
}

function getRotationHandleAt(point) {
  if (!computedSelectionBounds.value || !selectionHasIcons.value) return null;
  const handle = getRotationHandle(computedSelectionBounds.value);
  const dist = Math.hypot(point.x - handle.x, point.y - handle.y);
  return dist <= ROTATION_HANDLE_RADIUS + 6;
}

function getSelectionHandleAt(point) {
  if (!computedSelectionBounds.value) return null;
  const hit = SELECTION_HANDLE_HIT / 2;
  for (const handle of getSelectionHandles(computedSelectionBounds.value)) {
    if (
      Math.abs(point.x - handle.x) <= hit &&
      Math.abs(point.y - handle.y) <= hit
    ) {
      return handle.id;
    }
  }
  return null;
}

function drawSelectionHandles(ctx, bounds) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#6c8cff";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([]);
  const size = SELECTION_HANDLE_SIZE;
  const half = size / 2;
  for (const handle of getSelectionHandles(bounds)) {
    ctx.beginPath();
    ctx.rect(handle.x - half, handle.y - half, size, size);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawRotationHandle(ctx, bounds) {
  const handle = getRotationHandle(bounds);
  ctx.save();
  ctx.strokeStyle = "#6c8cff";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(bounds.x + bounds.w / 2, bounds.y);
  ctx.lineTo(handle.x, handle.y);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(handle.x, handle.y, ROTATION_HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function computeBoundsFromPoints(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

function getShapeBounds(stroke) {
  if (stroke.shape === "line") {
    const minX = Math.min(stroke.x, stroke.x2);
    const maxX = Math.max(stroke.x, stroke.x2);
    const minY = Math.min(stroke.y, stroke.y2);
    const maxY = Math.max(stroke.y, stroke.y2);
    return { minX, minY, maxX, maxY };
  }
  return {
    minX: Math.min(stroke.x, stroke.x + stroke.w),
    minY: Math.min(stroke.y, stroke.y + stroke.h),
    maxX: Math.max(stroke.x, stroke.x + stroke.w),
    maxY: Math.max(stroke.y, stroke.y + stroke.h),
  };
}

function getStrokeBounds(stroke) {
  if (stroke.bbox) return stroke.bbox;
  if (stroke.type === STROKE_TYPES.ICON) {
    // Icons have x, y, width, height properties
    stroke.bbox = {
      minX: stroke.x,
      minY: stroke.y,
      maxX: stroke.x + stroke.width,
      maxY: stroke.y + stroke.height,
    };
    return stroke.bbox;
  }
  if (stroke.type === STROKE_TYPES.SHAPE) {
    stroke.bbox = getShapeBounds(stroke);
    return stroke.bbox;
  }
  stroke.bbox = computeBoundsFromPoints(stroke.points);
  return stroke.bbox;
}

function getSelectionBounds(ids) {
  const slide = getActiveSlide();
  if (!slide || !ids.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  ids.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    if (!stroke) return;
    const bbox = getStrokeBounds(stroke);
    minX = Math.min(minX, bbox.minX);
    minY = Math.min(minY, bbox.minY);
    maxX = Math.max(maxX, bbox.maxX);
    maxY = Math.max(maxY, bbox.maxY);
  });
  if (!ids.length) return null;
  return {
    x: minX,
    y: minY,
    w: maxX - minX,
    h: maxY - minY,
    right: maxX,
    bottom: maxY,
  };
}

// updateSelectionBounds is no longer needed - bounds are computed automatically
// Keeping function stub for any external calls that reference it
function updateSelectionBounds() {
  // No-op: bounds are now computed via computedSelectionBounds
}

async function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_DECK)) {
          db.createObjectStore(STORE_DECK);
        }
        if (!db.objectStoreNames.contains(STORE_RECORDINGS)) {
          db.createObjectStore(STORE_RECORDINGS, { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
      },
    });
  }
  return dbPromise;
}

function serializeStroke(stroke) {
  return {
    id: stroke.id,
    type: stroke.type,
    tool: stroke.tool,
    color: stroke.color,
    size: stroke.size,
    alpha: stroke.alpha,
    composite: stroke.composite,
    fillColor: stroke.fillColor || null,
    shape: stroke.shape,
    x: stroke.x,
    y: stroke.y,
    w: stroke.w,
    h: stroke.h,
    x2: stroke.x2,
    y2: stroke.y2,
    points: stroke.points,
    bbox: stroke.bbox || null,
  };
}

function serializeCommand(cmd) {
  if (cmd.type === "add" || cmd.type === "remove") {
    return {
      ...cmd,
      items: cmd.items.map((item) => ({
        index: item.index,
        stroke: serializeStroke(item.stroke),
      })),
    };
  }
  if (cmd.type === "transform") {
    return {
      ...cmd,
      items: cmd.items.map((item) => ({
        id: item.id,
        before: item.before,
        after: item.after,
      })),
    };
  }
  if (cmd.type === "background") {
    return {
      ...cmd,
      before: { ...cmd.before, bitmap: null },
      after: { ...cmd.after, bitmap: null },
    };
  }
  return { ...cmd };
}

function serializeSlide(slide) {
  return {
    id: slide.id,
    backgroundColor: slide.backgroundColor,
    backgroundImage: slide.backgroundImage,
    backgroundSize: slide.backgroundSize,
    backgroundPattern: slide.backgroundPattern,
    strokes: slide.strokes.map(serializeStroke),
    history: (slide.history || []).map(serializeCommand),
    redoHistory: (slide.redoHistory || []).map(serializeCommand),
  };
}

function serializeDeck() {
  const { width, height } = getCanvasSize();
  return {
    version: 1,
    meta: { width, height },
    currentSlideIndex: currentSlideIndex.value,
    slides: slides.value.map(serializeSlide),
  };
}

function hydrateStroke(stroke, scaleX, scaleY) {
  if (stroke.type === STROKE_TYPES.SHAPE) {
    const s = {
      ...stroke,
      type: "shape",
      tool: "shape",
      x: (stroke.x || 0) * scaleX,
      y: (stroke.y || 0) * scaleY,
      w: (stroke.w || 0) * scaleX,
      h: (stroke.h || 0) * scaleY,
      x2: (stroke.x2 || 0) * scaleX,
      y2: (stroke.y2 || 0) * scaleY,
    };
    s.bbox = getShapeBounds(s);
    return s;
  }
  const points = Array.isArray(stroke.points)
    ? stroke.points.map((val, idx) =>
        idx % 2 === 0 ? val * scaleX : val * scaleY,
      )
    : [];
  const s = {
    ...stroke,
    type: stroke.type || "path",
    tool: stroke.tool || "pen",
    points,
  };
  s.bbox = points.length ? computeBoundsFromPoints(points) : null;
  return s;
}

function hydrateCommand(cmd, scaleX, scaleY) {
  if (cmd.type === "add" || cmd.type === "remove") {
    return {
      ...cmd,
      items: cmd.items.map((item) => ({
        index: item.index,
        stroke: hydrateStroke(item.stroke, scaleX, scaleY),
      })),
    };
  }
  if (cmd.type === "transform") {
    return {
      ...cmd,
      items: cmd.items.map((item) => ({
        ...item,
        before: scaleSnapshot(item.before, scaleX, scaleY),
        after: scaleSnapshot(item.after, scaleX, scaleY),
      })),
    };
  }
  return cmd;
}

function scaleSnapshot(snapshot, scaleX, scaleY) {
  if (!snapshot) return snapshot;
  if (snapshot.shape) {
    return {
      ...snapshot,
      x: snapshot.x * scaleX,
      y: snapshot.y * scaleY,
      w: snapshot.w * scaleX,
      h: snapshot.h * scaleY,
      x2: snapshot.x2 * scaleX,
      y2: snapshot.y2 * scaleY,
      bbox: snapshot.bbox
        ? {
            minX: snapshot.bbox.minX * scaleX,
            minY: snapshot.bbox.minY * scaleY,
            maxX: snapshot.bbox.maxX * scaleX,
            maxY: snapshot.bbox.maxY * scaleY,
          }
        : null,
    };
  }
  const points = Array.isArray(snapshot.points)
    ? snapshot.points.map((val, idx) =>
        idx % 2 === 0 ? val * scaleX : val * scaleY,
      )
    : [];
  return {
    ...snapshot,
    points,
    bbox: snapshot.bbox
      ? {
          minX: snapshot.bbox.minX * scaleX,
          minY: snapshot.bbox.minY * scaleY,
          maxX: snapshot.bbox.maxX * scaleX,
          maxY: snapshot.bbox.maxY * scaleY,
        }
      : null,
  };
}

function hydrateSlide(raw, scaleX, scaleY) {
  const slide = createSlide();
  slide.id = raw.id || slide.id;
  slide.backgroundColor = raw.backgroundColor || "#111111";
  slide.backgroundImage = raw.backgroundImage || null;
  slide.backgroundSize = raw.backgroundSize || null;
  slide.backgroundPattern = raw.backgroundPattern || null;
  slide.strokes = (raw.strokes || []).map((s) =>
    hydrateStroke(s, scaleX, scaleY),
  );
  slide.history = (raw.history || []).map((cmd) =>
    hydrateCommand(cmd, scaleX, scaleY),
  );
  slide.redoHistory = (raw.redoHistory || []).map((cmd) =>
    hydrateCommand(cmd, scaleX, scaleY),
  );
  slide.thumb = "";
  return slide;
}

async function saveDeckToDb() {
  try {
    const db = await getDb();
    const payload = serializeDeck();
    await db.put(STORE_DECK, payload, "default");
    deckDirty = false;
  } catch (err) {
    console.error("Failed to save deck", err);
  }
}

function markDirty() {
  deckDirty = true;
  if (saveTimeout) return;
  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    if (deckDirty) saveDeckToDb();
  }, 800);
}

function applyDeckPayload(payload) {
  if (!payload) return false;
  const { width, height } = getCanvasSize();
  const sourceWidth = payload?.meta?.width || width;
  const sourceHeight = payload?.meta?.height || height;
  const scaleX = sourceWidth ? width / sourceWidth : 1;
  const scaleY = sourceHeight ? height / sourceHeight : 1;

  // Migrate deck on load to ensure all strokes use new format
  migrateDeck(payload);

  slides.value = (payload.slides || []).map((slide) =>
    hydrateSlide(slide, scaleX, scaleY),
  );
  currentSlideIndex.value = Math.min(
    payload.currentSlideIndex || 0,
    slides.value.length - 1,
  );
  redrawAll();
  renderAllThumbnails();
  return true;
}

async function loadDeckFromDb() {
  try {
    const db = await getDb();
    const payload = await db.get(STORE_DECK, "default");
    if (!payload) return false;
    return applyDeckPayload(payload);
  } catch (err) {
    console.error("Failed to load deck", err);
    return false;
  }
}

async function loadRecordings() {
  try {
    const db = await getDb();
    const all = await db.getAll(STORE_RECORDINGS);
    recordings.value = all
      .map((rec) => ({
        ...rec,
        createdAt:
          rec.createdAt ||
          (rec.createdAtTs ? new Date(rec.createdAtTs).toLocaleString() : ""),
      }))
      .sort((a, b) => b.createdAtTs - a.createdAtTs);
  } catch (err) {
    console.error("Failed to load recordings", err);
  }
}

async function saveRecording(record) {
  try {
    const db = await getDb();
    await db.put(STORE_RECORDINGS, record);
    await loadRecordings();
  } catch (err) {
    console.error("Failed to save recording", err);
  }
}

async function deleteRecording(id) {
  try {
    const db = await getDb();
    await db.delete(STORE_RECORDINGS, id);
    const url = recordingUrls.get(id);
    if (url) {
      URL.revokeObjectURL(url);
      recordingUrls.delete(id);
    }
    await loadRecordings();
  } catch (err) {
    console.error("Failed to delete recording", err);
  }
}

async function loadDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameras.value = devices.filter((dev) => dev.kind === "videoinput");
    microphones.value = devices.filter((dev) => dev.kind === "audioinput");
    if (!precheck.cameraId && cameras.value.length) {
      precheck.cameraId = cameras.value[0].deviceId;
    }
    if (!precheck.micId && microphones.value.length) {
      precheck.micId = microphones.value[0].deviceId;
    }
  } catch (err) {
    console.warn("Failed to load devices", err);
  }
}

async function handleCameraDeviceChange() {
  if (webcam.enabled) {
    if (webcam.stream) {
      webcam.stream.getTracks().forEach((track) => track.stop());
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: avControls.cameraEnabled
          ? precheck.cameraId
            ? { deviceId: { exact: precheck.cameraId } }
            : true
          : false,
        audio: false,
      });
      webcam.stream = stream;
      if (webcamVideo.value) webcamVideo.value.srcObject = stream;
      setCameraEnabled(avControls.cameraEnabled, stream);
      setCameraMuted(avControls.cameraMuted, stream);
    } catch (err) {
      console.warn("Failed to switch camera", err);
    }
  }
}

async function handleMicDeviceChange() {
  if (isRecording.value && state.recordingAudio) {
    console.warn("Mic device change will apply to next recording.");
  }
  if (isLiveBroadcasting.value) {
    if (micPreviewStream) {
      stopMicPreview();
    }
    await startMicPreview();
    await refreshLiveAudioTrack();
    return;
  }
  if (micPreviewStream) {
    stopMicPreview();
    await startMicPreview();
  }
}

async function toggleWebcam() {
  if (!avControls.cameraEnabled) return;
  if (webcam.enabled) {
    if (webcam.stream) {
      webcam.stream.getTracks().forEach((track) => track.stop());
    }
    webcam.stream = null;
    webcam.enabled = false;
    if (webcamVideo.value) webcamVideo.value.srcObject = null;
    stopWebcamLoop();
    return;
  }
  try {
    let stream = null;
    try {
      const constraints = {
        video: {
          deviceId: precheck.cameraId
            ? { exact: precheck.cameraId }
            : undefined,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.warn("Exact device failed, falling back to default camera", err);
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
    }
    webcam.stream = stream;
    webcam.enabled = true;
    positionWebcamDefault();
    attachWebcamStream(stream);
    setCameraEnabled(avControls.cameraEnabled, stream);
    setCameraMuted(avControls.cameraMuted, stream);
    updateWebcamCanvasSize();
    loadDevices();
    if (webcam.chromaEnabled) startWebcamLoop();
  } catch (err) {
    console.warn("Failed to enable webcam", err);
  }
}

function positionWebcamDefault() {
  if (!inkCanvas.value || !boardStage.value) return;
  if (webcam.userPlaced) return;

  const canvas = inkCanvas.value;
  const canvasRect = canvas.getBoundingClientRect();

  // Work in logical (CSS) pixels since the context has a transform applied
  const logicalWidth = canvasRect.width;
  const logicalHeight = canvasRect.height;

  // Position in bottom-right corner with margin (in logical pixels)
  const margin = 20;
  webcam.x = Math.max(margin, logicalWidth - webcam.width - margin);
  webcam.y = Math.max(margin, logicalHeight - webcam.height - margin);
}

function attachWebcamStream(stream, retry = true) {
  if (!webcamVideo.value) {
    if (retry) {
      nextTick(() => attachWebcamStream(stream, false));
    }
    return;
  }
  webcamVideo.value.srcObject = stream;
  webcamVideo.value.onloadedmetadata = () => {
    const w = webcamVideo.value.videoWidth || 16;
    const h = webcamVideo.value.videoHeight || 9;
    webcam.aspect = w / h;
    if (!webcam.width) {
      webcam.height = 450;
      webcam.width = Math.round(webcam.height * webcam.aspect);
    }
    if (!webcam.height) {
      webcam.height = 450;
      webcam.width = Math.round(webcam.height * webcam.aspect);
    }
    webcam.prevHeight = webcam.height;
    webcam.prevWidth = webcam.width;
    updateWebcamCanvasSize();
    webcamVideo.value.play().catch(() => {});
  };
  webcamVideo.value.onresize = () => {
    const w = webcamVideo.value.videoWidth || 16;
    const h = webcamVideo.value.videoHeight || 9;
    webcam.aspect = w / h;
    if (!webcam.width) {
      webcam.height = 450;
      webcam.width = Math.round(webcam.height * webcam.aspect);
    }
    if (!webcam.height) {
      webcam.height = 450;
      webcam.width = Math.round(webcam.height * webcam.aspect);
    }
    updateWebcamCanvasSize();
  };
}

function toggleWebcamFlip() {
  webcam.flip = !webcam.flip;
}

function toggleWebcamMinimize() {
  if (!webcam.enabled) return;
  if (!webcam.minimized) {
    webcam.prevWidth = webcam.width;
    webcam.prevHeight = webcam.height;
    const baseHeight = webcam.height || 450;
    webcam.height = Math.max(140, Math.round(baseHeight * 0.6));
    webcam.width = Math.round(webcam.height * webcam.aspect);
    webcam.minimized = true;
  } else {
    webcam.width = webcam.prevWidth || Math.round(450 * webcam.aspect);
    webcam.height = webcam.prevHeight || 450;
    webcam.minimized = false;
  }
  updateWebcamCanvasSize();
}

function toggleChroma() {
  webcam.chromaEnabled = !webcam.chromaEnabled;
  if (webcam.chromaEnabled) {
    startWebcamLoop();
  } else {
    stopWebcamLoop();
  }
}

function setCameraEnabled(enabled, streamOverride = null) {
  avControls.cameraEnabled = enabled;
  const stream = streamOverride || webcam.stream;
  stream?.getVideoTracks()?.forEach((track) => {
    track.enabled = enabled;
    if (!enabled) track.stop();
  });
  if (!enabled && webcam.enabled) {
    webcam.wasEnabled = true;
    webcam.enabled = false;
    if (webcamVideo.value) webcamVideo.value.srcObject = null;
  }
}

function setCameraMuted(muted, streamOverride = null) {
  avControls.cameraMuted = muted;
  const stream = streamOverride || webcam.stream;
  stream?.getVideoTracks()?.forEach((track) => {
    track.enabled = !muted;
  });
}

function setMicEnabled(enabled, streamOverride = null) {
  avControls.micEnabled = enabled;
  const stream =
    streamOverride ||
    state.recordingAudio ||
    liveAudioStream ||
    micPreviewStream ||
    null;
  stream?.getAudioTracks()?.forEach((track) => {
    track.enabled = enabled;
  });
  if (state.recordingAudio) {
    state.recordingAudio.getAudioTracks()?.forEach((track) => {
      track.enabled = enabled;
    });
  }
  if (liveAudioStream) {
    liveAudioStream.getAudioTracks()?.forEach((track) => {
      track.enabled = enabled;
    });
  }
  if (liveAudioGain) {
    liveAudioGain.gain.value = enabled ? 1 : 0;
  }
}

function setCamPaused(paused) {
  camPaused.value = paused;
  const stream = webcam.stream;
  stream?.getVideoTracks()?.forEach((track) => {
    track.enabled = !paused;
  });
}

function setMicPaused(paused) {
  micPaused.value = paused;
  const stream = state.recordingAudio || liveAudioStream || micPreviewStream;
  stream?.getAudioTracks()?.forEach((track) => {
    track.enabled = !paused;
  });
  if (liveAudioGain) {
    liveAudioGain.gain.value = paused ? 0 : 1;
  }
}

function toggleCamera() {
  const next = !avControls.cameraEnabled;
  setCameraEnabled(next);
  if (next) {
    setCamPaused(false);
    if (!webcam.enabled || !isStreamActive(webcam.stream)) {
      startCamera();
    }
    if (webcam.wasEnabled) webcam.wasEnabled = false;
  } else if (webcam.enabled) {
    stopCamera();
  }
}

function startCamera() {
  if (avControls.cameraEnabled && webcam.enabled) {
    if (!isStreamActive(webcam.stream)) {
      if (webcam.stream) {
        webcam.stream.getTracks().forEach((track) => track.stop());
      }
      webcam.enabled = false;
      toggleWebcam();
    }
    return;
  }
  if (!precheck.cameraId && cameras.value.length) {
    precheck.cameraId = cameras.value[0].deviceId;
  }
  if (!hasAskedAvPermissions.value) {
    ensureAvPermissions().then(() => {
      if (!webcam.enabled) toggleWebcam();
    });
    if (!avControls.cameraEnabled) setCameraEnabled(true);
    return;
  }
  if (!avControls.cameraEnabled) setCameraEnabled(true);
  if (!webcam.enabled) toggleWebcam();
}

async function ensureAvPermissions() {
  if (hasAskedAvPermissions.value) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    // ignore, permission may be denied
  }
  hasAskedAvPermissions.value = true;
  await loadDevices();
  setTimeout(loadDevices, 200);
}

function stopCamera() {
  if (webcam.enabled) toggleWebcam();
  if (avControls.cameraEnabled) setCameraEnabled(false);
  setCamPaused(false);
}

function toggleCameraMute() {
  if (!avControls.cameraEnabled) return;
  const next = !avControls.cameraMuted;
  setCameraMuted(next);
}

function toggleMic() {
  const next = !avControls.micEnabled;
  setMicEnabled(next);
  if (next) {
    setMicPaused(false);
    ensureAvPermissions().then(async () => {
      if (micPreviewStream && !isAudioActive(micPreviewStream)) {
        stopMicPreview();
      }
      if (!micPreviewStream && !isRecording.value) {
        await startMicPreview();
      }
      if (isLiveBroadcasting.value) {
        await refreshLiveAudioTrack();
      }
    });
  } else {
    setMicPaused(true);
    if (!isLiveBroadcasting.value) {
      stopMicPreview();
      setMicPaused(false);
    }
  }
}

function toggleCamPause() {
  if (!avControls.cameraEnabled) return;
  setCamPaused(!camPaused.value);
}

function toggleMicPause() {
  if (!avControls.micEnabled) return;
  setMicPaused(!micPaused.value);
}

async function startMicPreview() {
  if (micPreviewStream || isRecording.value) return;
  try {
    micPreviewStream = await navigator.mediaDevices.getUserMedia({
      audio: micConstraints.value,
    });
    setMicEnabled(true, micPreviewStream);
    startMicMeter(micPreviewStream);
    loadDevices();
  } catch (err) {
    console.warn("Failed to start mic preview", err);
  }
}

function stopMicPreview() {
  if (!micPreviewStream) return;
  micPreviewStream.getTracks().forEach((track) => track.stop());
  micPreviewStream = null;
  stopMicMeter();
}

function startMicMeter(stream) {
  if (!stream?.getAudioTracks()?.length) return;
  stopMicMeter();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const ctx = new AudioCtx();
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  const source = ctx.createMediaStreamSource(stream);
  source.connect(analyser);
  const data = new Uint8Array(analyser.frequencyBinCount);
  micMeter = { ctx, analyser, source };
  micMeterInterval = setInterval(() => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length);
    micLevel.value = Math.min(1, rms * 2.5);
  }, 120);
}

function stopMicMeter() {
  if (micMeterInterval) {
    clearInterval(micMeterInterval);
    micMeterInterval = null;
  }
  if (micMeter?.ctx) {
    micMeter.ctx.close();
  }
  micMeter = null;
  micLevel.value = 0;
}

function onWebcamDragStart(event) {
  if (!webcam.enabled || webcam.locked) return;
  if (event.target?.closest?.(".webcam-resize-handle")) return;

  webcam.dragging = true;

  const canvas = inkCanvas.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();

  // Mouse position in CSS pixels relative to canvas
  const mouseCssX = event.clientX - rect.left;
  const mouseCssY = event.clientY - rect.top;

  // Calculate drag offset in logical (CSS) pixels
  // webcam.x and webcam.y are in logical pixels (due to context transform)
  webcam.dragOffsetX = mouseCssX - webcam.x;
  webcam.dragOffsetY = mouseCssY - webcam.y;

  window.addEventListener("pointermove", onWebcamDragMove);
  window.addEventListener("pointerup", onWebcamDragEnd);
}

function onWebcamDragMove(event) {
  if (!webcam.dragging || !boardStage.value || !inkCanvas.value) return;

  const canvas = inkCanvas.value;
  const canvasRect = canvas.getBoundingClientRect();

  // Get mouse position in CSS coordinates relative to canvas
  const cssMouseX = event.clientX - canvasRect.left;
  const cssMouseY = event.clientY - canvasRect.top;

  // Calculate new position in logical (CSS) pixels
  // Apply the drag offset (which is already in CSS/logical pixels)
  webcam.x = cssMouseX - webcam.dragOffsetX;
  webcam.y = cssMouseY - webcam.dragOffsetY;

  requestOverlay();
}

function onWebcamDragEnd() {
  webcam.dragging = false;
  window.removeEventListener("pointermove", onWebcamDragMove);
  window.removeEventListener("pointerup", onWebcamDragEnd);
}

function onWebcamResizeStart(event) {
  if (!webcam.enabled || webcam.locked) return;
  webcam.resizing = true;
  webcam.resizeStartX = event.clientX;
  webcam.resizeStartY = event.clientY;
  webcam.resizeStartW = webcam.width;
  webcam.resizeStartH = webcam.height;
  window.addEventListener("pointermove", onWebcamResizeMove);
  window.addEventListener("pointerup", onWebcamResizeEnd);
}

function onWebcamResizeMove(event) {
  if (!webcam.resizing || !inkCanvas.value) return;

  const canvas = inkCanvas.value;
  const canvasRect = canvas.getBoundingClientRect();

  // Calculate change in CSS pixels (logical pixels)
  const cssDx = event.clientX - webcam.resizeStartX;

  // Apply the change directly (since webcam size is in logical pixels)
  let nextW = Math.max(140, webcam.resizeStartW + cssDx);

  let nextWidth = nextW;
  let nextHeight = nextWidth / webcam.aspect;

  if (nextHeight < 90) {
    nextHeight = 90;
    nextWidth = Math.round(nextHeight * webcam.aspect);
  }

  webcam.width = nextWidth;
  webcam.height = nextHeight;

  updateWebcamCanvasSize();
}

function onWebcamResizeEnd() {
  webcam.resizing = false;
  window.removeEventListener("pointermove", onWebcamResizeMove);
  window.removeEventListener("pointerup", onWebcamResizeEnd);
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getClockParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  const hours = d.getHours();
  const isPm = hours >= 12;
  const h12 = hours % 12 || 12;
  const main = `${h12.toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return {
    main,
    seconds: d.getSeconds().toString().padStart(2, "0"),
    suffix: isPm ? "PM" : "AM",
  };
}

function parseTimerInput(raw) {
  if (!raw) return null;
  const cleaned = raw.trim();
  if (!cleaned) return null;
  if (/^\d+$/.test(cleaned)) {
    const mins = Math.max(0, parseInt(cleaned, 10));
    return mins * 60 * 1000;
  }
  const parts = cleaned.split(":").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const mins = parseInt(parts[0], 10);
  const secs = parseInt(parts[1], 10);
  if (Number.isNaN(mins) || Number.isNaN(secs)) return null;
  if (secs < 0 || secs > 59) return null;
  return Math.max(0, mins) * 60 * 1000 + secs * 1000;
}

function hexToRgb(hex) {
  if (!hex || hex[0] !== "#" || hex.length < 7) return [0, 255, 0];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function truncateText(ctx, text, maxWidth) {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let low = 0;
  let high = text.length;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = `${text.slice(0, mid)}…`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  const safe = Math.max(0, low - 1);
  return `${text.slice(0, safe)}…`;
}

function fitTextSize(ctx, text, baseSize, maxWidth, maxHeight) {
  if (!text) return baseSize;
  const safeW = Math.max(1, maxWidth);
  const safeH = Math.max(1, maxHeight);
  ctx.font = `600 ${baseSize}px "Space Grotesk", sans-serif`;
  const metrics = ctx.measureText(text);
  const textW = metrics.width || 1;
  const textH =
    (metrics.actualBoundingBoxAscent || baseSize) +
    (metrics.actualBoundingBoxDescent || 0);
  const scale = Math.min(1, safeW / textW, safeH / textH);
  return Math.max(1, baseSize * scale);
}

function isStreamActive(stream) {
  if (!stream) return false;
  const tracks = stream.getVideoTracks();
  return tracks.some((track) => track.readyState === "live");
}

function isAudioActive(stream) {
  if (!stream) return false;
  const tracks = stream.getAudioTracks();
  return tracks.some((track) => track.readyState === "live");
}

function pickMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function pickAudioMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function startRecordingTimer() {
  if (recordingTimer) clearInterval(recordingTimer);
  recordingStartTs.value = Date.now();
  recordingTimer = setInterval(() => {
    if (!recordingStartTs.value) return;
    recordingElapsedMs.value =
      recordingBaseMs + (Date.now() - recordingStartTs.value);
  }, 250);
}

function stopRecordingTimer() {
  if (recordingTimer) clearInterval(recordingTimer);
  recordingTimer = null;
  recordingStartTs.value = null;
}

function pauseRecordingTimer() {
  if (!recordingStartTs.value) return;
  recordingBaseMs += Date.now() - recordingStartTs.value;
  recordingStartTs.value = null;
}

function resetRecordingTimer() {
  recordingBaseMs = 0;
  recordingElapsedMs.value = 0;
  recordingStartTs.value = null;
  recordingPaused.value = false;
}

function renderRecordingFrame() {
  if (!recordCompositeCtx || !recordCompositeCanvas) return;

  const { width, height } = getCanvasSize();

  const recordWidth = recordSize.width;
  const recordHeight = recordSize.height;
  recordCompositeCtx.clearRect(0, 0, recordWidth, recordHeight);

  const sourceAspect = width / height;
  const recordAspect = recordWidth / recordHeight;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (sourceAspect > recordAspect) {
    drawWidth = recordWidth;
    drawHeight = recordWidth / sourceAspect;
    offsetX = 0;
    offsetY = (recordHeight - drawHeight) / 2;
  } else {
    drawHeight = recordHeight;
    drawWidth = recordHeight * sourceAspect;
    offsetY = 0;
    offsetX = (recordWidth - drawWidth) / 2;
  }

  // ⭐ Background
  if (backgroundCanvas.value) {
    recordCompositeCtx.drawImage(
      backgroundCanvas.value,
      0,
      0,
      width,
      height,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
    );
  }

  // ⭐ Ink
  if (inkCanvas.value) {
    recordCompositeCtx.drawImage(
      inkCanvas.value,
      0,
      0,
      width,
      height,
      offsetX,
      offsetY,
      drawWidth,
      drawHeight,
    );
  }

  // ⭐ Scale factors from physical canvas pixels to recording pixels
  const scaleX = drawWidth / width;
  const scaleY = drawHeight / height;

  // ⭐ Device pixel ratio to convert logical to physical pixels
  const ratio = window.devicePixelRatio || 1;

  // ⭐ Webcam (need to account for logical → physical → recording conversion)
  drawWebcamLayerComposite(
    recordCompositeCtx,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
    ratio,
  );
  drawWidgetsComposite(
    recordCompositeCtx,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
    ratio,
  );
}

function updateWebcamCanvasSize() {
  if (!webcamCanvas.value) return;
  const vw = webcamVideo.value?.videoWidth;
  const vh = webcamVideo.value?.videoHeight;
  if (vw && vh) {
    webcamCanvas.value.width = vw;
    webcamCanvas.value.height = vh;
    return;
  }
  webcamCanvas.value.width = Math.max(1, Math.floor(webcam.width));
  webcamCanvas.value.height = Math.max(1, Math.floor(webcam.height));
}

function drawChromaToCanvas(videoEl, canvasEl, ctx) {
  if (!videoEl || !canvasEl || !ctx) return false;
  if (videoEl.readyState < 2) return false;
  const width = canvasEl.width;
  const height = canvasEl.height;
  const vw = videoEl.videoWidth || width;
  const vh = videoEl.videoHeight || height;
  const scale = Math.min(width / vw, height / vh);
  const drawW = Math.round(vw * scale);
  const drawH = Math.round(vh * scale);
  const drawX = Math.round((width - drawW) / 2);
  const drawY = Math.round((height - drawH) / 2);
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);
  const frame = ctx.getImageData(0, 0, width, height);
  const data = frame.data;
  const keyR = 0;
  const keyG = 255;
  const keyB = 0;
  const CHROMA_THRESHOLD = 90;
  const CHROMA_SOFTNESS = 30;
  const CHROMA_DIFF_THRESHOLD = 35;
  const CHROMA_DIFF_SOFTNESS = 25;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const maxOther = Math.max(r, b);
    const diff = g - maxOther;
    if (diff > CHROMA_DIFF_THRESHOLD) {
      data[i + 3] = 0;
      continue;
    }
    if (diff > CHROMA_DIFF_THRESHOLD - CHROMA_DIFF_SOFTNESS) {
      const t = (CHROMA_DIFF_THRESHOLD - diff) / CHROMA_DIFF_SOFTNESS;
      data[i + 3] = Math.max(0, Math.min(255, data[i + 3] * t));
      continue;
    }
    const dr = r - keyR;
    const dg = g - keyG;
    const db = b - keyB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < CHROMA_THRESHOLD - CHROMA_SOFTNESS) {
      data[i + 3] = 0;
    } else if (dist < CHROMA_THRESHOLD) {
      const t = (dist - (CHROMA_THRESHOLD - CHROMA_SOFTNESS)) / CHROMA_SOFTNESS;
      data[i + 3] = Math.max(0, Math.min(255, data[i + 3] * t));
    }
  }
  ctx.putImageData(frame, 0, 0);
  return true;
}

function drawWebcamLayer(ctx) {
  if (!webcam.enabled || !webcamVideo.value || camPaused.value) return;
  if (webcam.chromaEnabled && webcamCanvas.value) {
    ctx.save();
    if (webcam.flip) {
      ctx.translate(webcam.x + webcam.width, webcam.y);
      ctx.scale(-1, 1);
      ctx.drawImage(webcamCanvas.value, 0, 0, webcam.width, webcam.height);
    } else {
      ctx.drawImage(
        webcamCanvas.value,
        webcam.x,
        webcam.y,
        webcam.width,
        webcam.height,
      );
    }
    ctx.restore();
    return;
  }

  if (webcamVideo.value.readyState < 2) return;
  ctx.save();
  if (webcam.flip) {
    ctx.translate(webcam.x + webcam.width, webcam.y);
    ctx.scale(-1, 1);
    ctx.drawImage(webcamVideo.value, 0, 0, webcam.width, webcam.height);
  } else {
    ctx.drawImage(
      webcamVideo.value,
      webcam.x,
      webcam.y,
      webcam.width,
      webcam.height,
    );
  }
  ctx.restore();
}

function drawWebcamLayerComposite(
  ctx,
  scaleX,
  scaleY,
  offsetX,
  offsetY,
  ratio,
) {
  if (!webcam.enabled || camPaused.value) return;

  const src =
    webcam.chromaEnabled && webcamCanvas.value
      ? webcamCanvas.value
      : webcamVideo.value;

  if (!src) return;
  const srcWidth = "videoWidth" in src ? src.videoWidth : src.width;
  const srcHeight = "videoHeight" in src ? src.videoHeight : src.height;
  if (!srcWidth || !srcHeight) return;

  // webcam.x, webcam.y, webcam.width, webcam.height are in LOGICAL (CSS) pixels
  // ratio converts logical pixels → physical canvas pixels
  // scaleX and scaleY convert physical canvas pixels → recording pixels
  // offsetX and offsetY are the letterbox offsets in recording space

  // First convert from logical to physical canvas pixels
  const physicalX = webcam.x * ratio;
  const physicalY = webcam.y * ratio;
  const physicalWidth = webcam.width * ratio;
  const physicalHeight = webcam.height * ratio;

  // Then scale from physical canvas pixels to recording pixels
  const w = physicalWidth * scaleX;
  const h = physicalHeight * scaleY;
  const x = offsetX + physicalX * scaleX;
  const y = offsetY + physicalY * scaleY;

  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Scale border radius proportionally
  const scaledRadius = 14 * ratio * Math.min(scaleX, scaleY);
  drawRoundedRectPath(ctx, x, y, w, h, scaledRadius);
  ctx.clip();

  if (webcam.flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(src, 0, 0, srcWidth, srcHeight, 0, 0, w, h);
  } else {
    ctx.drawImage(src, 0, 0, srcWidth, srcHeight, x, y, w, h);
  }

  ctx.restore();
}

function setWidgetDomRef(id, el) {
  if (!id) return;
  if (el) {
    widgetDomRefs.set(id, el);
  } else {
    widgetDomRefs.delete(id);
  }
}

function cloneNodeWithInlineStyles(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(node.textContent || "");
  }
  if (!(node instanceof Element)) {
    return node.cloneNode(false);
  }
  const clone = node.cloneNode(false);
  const computed = window.getComputedStyle(node);
  let cssText = "";
  for (const prop of computed) {
    cssText += `${prop}:${computed.getPropertyValue(prop)};`;
  }
  if (cssText) {
    clone.setAttribute("style", cssText);
  }
  node.childNodes.forEach((child) => {
    clone.appendChild(cloneNodeWithInlineStyles(child));
  });
  return clone;
}

async function renderElementToImage(element, width, height) {
  const cloned = cloneNodeWithInlineStyles(element);
  const wrapper = document.createElement("div");
  wrapper.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  wrapper.style.width = `${width}px`;
  wrapper.style.height = `${height}px`;
  wrapper.appendChild(cloned);

  const serializer = new XMLSerializer();
  const html = serializer.serializeToString(wrapper);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%">${html}</foreignObject></svg>`;
  const img = new Image();
  img.decoding = "async";
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  await img.decode();
  return img;
}

function getStopwatchSnapshotKey(widget) {
  const elapsedKey = Math.floor((widget.stopwatch?.elapsedMs || 0) / 100);
  const lapKey = (widget.stopwatch?.laps || [])
    .map((lap) => `${lap.label}:${lap.totalMs}:${lap.lapMs}`)
    .join("|");
  return `${widget.width}x${widget.height}:${elapsedKey}:${lapKey}`;
}

function getStopwatchSnapshot(widget) {
  const wrapper = widgetDomRefs.get(widget.id);
  if (!wrapper) return null;
  const card = wrapper.querySelector(".widget-card");
  if (!card) return null;
  const cacheKey = getStopwatchSnapshotKey(widget);
  let cache = widgetSnapshotCache.get(widget.id);
  if (!cache) {
    cache = { key: null, img: null, pending: false, lastRender: 0 };
    widgetSnapshotCache.set(widget.id, cache);
  }
  const now = performance.now();
  if (
    cache.key !== cacheKey &&
    !cache.pending &&
    now - cache.lastRender > 80
  ) {
    cache.pending = true;
    renderElementToImage(card, widget.width, widget.height)
      .then((img) => {
        cache.img = img;
        cache.key = cacheKey;
        cache.lastRender = performance.now();
      })
      .catch(() => {})
      .finally(() => {
        cache.pending = false;
      });
  }
  return cache.img;
}

function drawWidgetsComposite(ctx, scaleX, scaleY, offsetX, offsetY, ratio) {
  if (!widgets.value.length) return;
  if (
    !isLiveBroadcasting.value &&
    !isRecording.value &&
    !isPreviewingRecording.value
  ) {
    return;
  }
  const audienceWidgets = widgets.value.filter((w) => w.showForUsers);
  if (!audienceWidgets.length) return;
  const clockParts = getClockParts(clockNow.value);
  const scaleFactor = Math.min(scaleX, scaleY);

  audienceWidgets.forEach((widget) => {
    const physicalX = widget.x * ratio;
    const physicalY = widget.y * ratio;
    const physicalWidth = widget.width * ratio;
    const physicalHeight = widget.height * ratio;
    const w = physicalWidth * scaleX;
    const h = physicalHeight * scaleY;
    const x = offsetX + physicalX * scaleX;
    const y = offsetY + physicalY * scaleY;
    if (widget.type === "stopwatch") {
      const snapshot = getStopwatchSnapshot(widget);
      if (snapshot) {
        ctx.save();
        ctx.globalAlpha = 0.95;
        ctx.drawImage(snapshot, x, y, w, h);
        ctx.restore();
        return;
      }
    }
    const cssScale = Math.min(
      w / Math.max(1, widget.width),
      h / Math.max(1, widget.height),
    );
    const cssBase = Math.max(1, Math.min(widget.width, widget.height));
    const stopwatchBase =
      widget.type === "stopwatch"
        ? Math.max(1, Math.min(widget.width, widget.height + 100))
        : cssBase;
    const paddingX = 12 * cssScale;
    const paddingY = 10 * cssScale;
    const cardGap = 10 * cssScale;
    const bodyGap = 8 * cssScale;
    const stopwatchGap = -132 * cssScale;
    const labelSize = Math.max(10, Math.min(12, cssBase * 0.07)) * cssScale;
    const labelLine = labelSize * 1.2;
    const timeScale = widget.type === "stopwatch" ? 0.28 : 0.32;
    const timeMin = widget.type === "stopwatch" ? 16 : 18;
    const timeSize = Math.max(timeMin, stopwatchBase * timeScale) * cssScale;

    ctx.save();
    ctx.globalAlpha = 0.95;
    const radius = 14 * ratio * scaleFactor;
    drawRoundedRectPath(ctx, x, y, w, h, radius);
    const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
    gradient.addColorStop(0, "rgba(15, 23, 42, 0.75)");
    gradient.addColorStop(1, "rgba(15, 23, 42, 0.35)");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
    ctx.lineWidth = Math.max(1, 1.4 * ratio * scaleFactor);
    ctx.stroke();

    const label =
      widget.type === "clock"
        ? "CLOCK"
        : widget.type === "timer"
          ? "TIMER"
          : widget.type === "stopwatch"
            ? "STOPWATCH"
            : "QR CODE";

    const showHeader = widget.type !== "stopwatch";
    if (showHeader) {
      ctx.fillStyle = "rgba(226, 232, 240, 0.8)";
      ctx.font = `${labelSize}px "Space Grotesk", sans-serif`;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(label, x + paddingX, y + paddingY);
    }

    const headerOffset = showHeader ? labelLine + cardGap : 0;
    const bodyTop = y + paddingY + headerOffset;
    const bodyHeight = Math.max(0, h - bodyTop - paddingY);
    const bodyWidth = Math.max(0, w - paddingX * 2);
    const edgeControlHeight = 0;
    const usableBodyHeight = bodyHeight;
    const bodyCenterY = bodyTop + bodyHeight * 0.5;

    // No action icons in recording/live composite

    if (widget.type === "qr") {
      const qrLayout = getQrLayoutMetrics(
        widget.width,
        widget.height,
        cssScale,
      );

      const img = widget.qr?.dataUrl
        ? qrImageCache.get(widget.qr.dataUrl)
        : null;
      if (img && img.complete) {
        const size = Math.max(8 * ratio * scaleFactor, qrLayout.previewSize);
        if (size <= 0) {
          ctx.restore();
          return;
        }
        const ix = x + (w - size) / 2;
        const iy = y + qrLayout.previewTop;
        ctx.fillStyle = "#ffffff";
        ctx.save();
        drawRoundedRectPath(ctx, ix, iy, size, size, 12 * cssScale);
        ctx.fill();
        ctx.clip();
        const inset = 8 * cssScale;
        ctx.drawImage(
          img,
          ix + inset,
          iy + inset,
          Math.max(0, size - inset * 2),
          Math.max(0, size - inset * 2),
        );
        ctx.restore();
      }
      if (widget.qr?.text) {
        ctx.fillStyle = "rgba(226, 232, 240, 0.75)";
        ctx.font = `${qrLayout.inputFont}px "Space Grotesk", sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const text = truncateText(ctx, widget.qr.text, qrLayout.bodyWidth);
        ctx.fillText(text, x + w / 2, y + qrLayout.inputCenterY);
      }
      ctx.restore();
      return;
    }

    ctx.fillStyle = "#f8fafc";
    ctx.font = `600 ${timeSize}px "Space Grotesk", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const mainText =
      widget.type === "clock"
        ? clockParts.main
        : widget.type === "timer"
          ? formatDuration(widget.timer.remainingMs)
          : formatStopwatch(widget.stopwatch.elapsedMs);

    if (widget.type === "timer") {
      const inputFont = Math.max(11, Math.min(14, cssBase * 0.1)) * cssScale;
      const inputHeight = inputFont * 1.2 + 12 * cssScale;
      const controlsHeight = Math.max(30 * cssScale, inputHeight);
      const displayHeight = Math.max(0, usableBodyHeight);
      const displayCenterY = bodyTop + displayHeight * 0.5;
      const ringLimit = cssBase * 0.78 * cssScale;
      const ringSize = Math.min(bodyWidth, displayHeight, ringLimit);
      const ringRadius = ringSize / 2;
      ctx.save();
      ctx.translate(x + w / 2, displayCenterY);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = "rgba(15, 23, 42, 0.45)";
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 8 * cssScale;
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
      const progress = getTimerProgress(widget);
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius, 0, Math.PI * 2 * progress);
      ctx.stroke();
      ctx.restore();
    }

    let textY = bodyCenterY;
    let stopwatchLayout = null;
    if (widget.type === "timer") {
      const inputFont = Math.max(11, Math.min(14, cssBase * 0.1)) * cssScale;
      const inputHeight = inputFont * 1.2 + 12 * cssScale;
      const controlsHeight = Math.max(30 * cssScale, inputHeight);
      const displayHeight = Math.max(0, usableBodyHeight);
      textY = bodyTop + displayHeight * 0.5;
    } else if (widget.type === "stopwatch") {
      const mainHeight = timeSize - 12 * cssScale;
      const lapsFont = Math.max(10, Math.min(12, cssBase * 0.07)) * cssScale;
      const lapRowHeight = lapsFont + 12 * cssScale;
      const lapsGap = 4 * cssScale;
      const lapCount = widget.stopwatch?.laps?.length || 0;
      const lapsHeight =
        lapCount > 0
          ? Math.min(
              160 * cssScale,
              lapCount * lapRowHeight + Math.max(0, lapCount - 1) * lapsGap,
            )
          : 0;
      const groupGap = stopwatchGap;
      const groupHeight =
        mainHeight + (lapCount > 0 ? lapsHeight + groupGap : 0);
      const groupTop =
        bodyTop + Math.max(0, (usableBodyHeight - groupHeight) / 2);
      textY = groupTop + mainHeight / 2;
      stopwatchLayout = {
        lapCount,
        lapsFont,
        lapRowHeight,
        lapsGap,
        lapsHeight,
        groupGap,
        groupTop,
        mainHeight,
        rowX: x + paddingX,
        rowWidth: bodyWidth,
      };
    }
    ctx.fillText(mainText, x + w / 2, textY);

    if (
      widget.type === "stopwatch" &&
      stopwatchLayout &&
      stopwatchLayout.lapCount > 0
    ) {
      const {
        lapCount,
        lapsFont,
        lapRowHeight,
        lapsGap,
        lapsHeight,
        groupGap,
        groupTop,
        mainHeight,
        rowX,
        rowWidth,
      } = stopwatchLayout;
      const availableRows = Math.max(
        1,
        Math.floor((lapsHeight + lapsGap) / (lapRowHeight + lapsGap)),
      );
      const startIndex = Math.max(0, lapCount - availableRows);
      const lapsToShow = widget.stopwatch.laps.slice(startIndex);
      const lapsTop = groupTop + mainHeight + groupGap;
      const rowRadius = 12 * cssScale;
      const rowPaddingX = 10 * cssScale;
      const rowPaddingY = 6 * cssScale;
      const labelPaddingX = 6 * cssScale;
      const labelPaddingY = 2 * cssScale;
      const splitPaddingX = 6 * cssScale;
      const splitPaddingY = 2 * cssScale;
      const timesGap = 10 * cssScale;

      lapsToShow.forEach((lap, index) => {
        const rowY = lapsTop + index * (lapRowHeight + lapsGap);
        const isLatest = startIndex + index === lapCount - 1;
        ctx.save();
        drawRoundedRectPath(ctx, rowX, rowY, rowWidth, lapRowHeight, rowRadius);
        ctx.fillStyle = isLatest
          ? "rgba(15, 23, 42, 0.5)"
          : "rgba(15, 23, 42, 0.35)";
        ctx.fill();
        ctx.strokeStyle = isLatest
          ? "rgba(56, 189, 248, 0.25)"
          : "rgba(255, 255, 255, 0.08)";
        ctx.lineWidth = Math.max(1, 1.1 * ratio * scaleFactor);
        ctx.stroke();

        const labelText = lap.label || "";
        ctx.font = `600 ${lapsFont}px "Space Grotesk", sans-serif`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "left";
        const labelWidth = ctx.measureText(labelText).width + labelPaddingX * 2;
        const labelHeight = lapsFont + labelPaddingY * 2;
        const labelX = rowX + rowPaddingX;
        const labelY = rowY + (lapRowHeight - labelHeight) / 2;
        drawRoundedRectPath(ctx, labelX, labelY, labelWidth, labelHeight, 999);
        ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
        ctx.lineWidth = Math.max(1, 1 * ratio * scaleFactor);
        ctx.stroke();
        ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
        ctx.fillText(
          labelText,
          labelX + labelPaddingX,
          rowY + lapRowHeight / 2,
        );

        const totalText = formatStopwatch(lap.totalMs);
        const splitText = `+${formatStopwatch(lap.lapMs)}`;
        ctx.font = `600 ${lapsFont}px "Space Grotesk", sans-serif`;
        const totalWidth = ctx.measureText(totalText).width;
        const splitTextWidth = ctx.measureText(splitText).width;
        const splitWidth = splitTextWidth + splitPaddingX * 2;
        let splitX = rowX + rowWidth - rowPaddingX - splitWidth;
        let totalX = splitX - timesGap - totalWidth;
        const minTimesX = labelX + labelWidth + timesGap;

        if (totalX < minTimesX) {
          totalX = rowX + rowWidth - rowPaddingX - totalWidth;
          splitX = null;
        }
        if (totalX < minTimesX) {
          totalX = minTimesX;
        }

        ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
        ctx.textAlign = "left";
        ctx.fillText(totalText, totalX, rowY + lapRowHeight / 2);

        if (splitX !== null) {
          const splitHeight = lapsFont + splitPaddingY * 2;
          const splitY = rowY + (lapRowHeight - splitHeight) / 2;
          drawRoundedRectPath(
            ctx,
            splitX,
            splitY,
            splitWidth,
            splitHeight,
            999,
          );
          ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
          ctx.fill();
          ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
          ctx.lineWidth = Math.max(1, 1 * ratio * scaleFactor);
          ctx.stroke();
          ctx.fillStyle = "rgba(56, 189, 248, 0.9)";
          ctx.fillText(
            splitText,
            splitX + splitPaddingX,
            rowY + lapRowHeight / 2,
          );
        }

        ctx.restore();
      });
    }

    if (widget.type === "clock") {
      const mainWidth = ctx.measureText(mainText).width;
      const clockGap = 12 * cssScale;
      const sideX = x + w / 2 + mainWidth / 2 + clockGap;
      const secondsSize = timeSize * 0.42;
      const suffixSize = timeSize * 0.28;
      ctx.save();
      ctx.font = `600 ${secondsSize}px "Space Grotesk", sans-serif`;
      const secondsWidth = ctx.measureText(clockParts.seconds).width;
      ctx.font = `600 ${suffixSize}px "Space Grotesk", sans-serif`;
      const suffixWidth = ctx.measureText(clockParts.suffix).width;
      ctx.restore();
      const pillPaddingX = 10 * cssScale;
      const pillPaddingY = 8 * cssScale;
      const pillInnerGap = 4 * cssScale;
      const pillWidth = Math.max(secondsWidth, suffixWidth) + pillPaddingX * 2;
      const pillHeight =
        secondsSize + suffixSize + pillInnerGap + pillPaddingY * 2;
      const pillX = sideX;
      const pillY = bodyCenterY - pillHeight / 2;
      const pillRadius = 8 * ratio * scaleFactor;
      ctx.save();
      drawRoundedRectPath(ctx, pillX, pillY, pillWidth, pillHeight, pillRadius);
      const pillGradient = ctx.createLinearGradient(
        pillX,
        pillY,
        pillX,
        pillY + pillHeight,
      );
      pillGradient.addColorStop(0, "rgba(15, 23, 42, 0.65)");
      pillGradient.addColorStop(1, "rgba(15, 23, 42, 0.35)");
      ctx.fillStyle = pillGradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = Math.max(1, 1.1 * ratio * scaleFactor);
      ctx.stroke();
      ctx.restore();

      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(248, 250, 252, 0.9)";
      ctx.font = `600 ${secondsSize}px "Space Grotesk", sans-serif`;
      ctx.fillText(
        clockParts.seconds,
        pillX + pillPaddingX,
        bodyCenterY - secondsSize * 0.25,
      );
      ctx.font = `600 ${suffixSize}px "Space Grotesk", sans-serif`;
      ctx.fillStyle = "rgba(248, 250, 252, 0.75)";
      ctx.fillText(
        clockParts.suffix,
        pillX + pillPaddingX,
        bodyCenterY + suffixSize * 0.9,
      );
    }

    ctx.restore();
  });
}

function getQrLayoutMetrics(widgetWidth, widgetHeight, scale) {
  const base = Math.max(1, Math.min(widgetWidth, widgetHeight));
  const paddingX = 12 * scale;
  const paddingY = 10 * scale;
  const cardGap = 10 * scale;
  const labelSize = Math.max(10, Math.min(12, base * 0.07)) * scale;
  const labelLine = labelSize * 1.2;
  const bodyHeight = Math.max(
    0,
    widgetHeight * scale - paddingY * 2 - labelLine - cardGap,
  );
  const bodyWidth = Math.max(0, widgetWidth * scale - paddingX * 2);
  const inputFont = Math.max(11, Math.min(14, base * 0.1)) * scale;
  const inputHeight = inputFont * 1.2 + 12 * scale;
  const inputMarginTop = 6 * scale;
  const qrGap = 8 * scale;
  const previewHeight = Math.max(
    0,
    bodyHeight - inputHeight - inputMarginTop - qrGap,
  );
  const previewSize = Math.max(0, Math.min(bodyWidth, previewHeight));
  const bodyTop = paddingY + labelLine + cardGap;
  const previewTop = bodyTop + (previewHeight - previewSize) / 2;
  const inputTop = bodyTop + previewHeight + qrGap + inputMarginTop;
  const inputCenterY = inputTop + inputHeight / 2;

  return {
    bodyWidth,
    inputFont,
    previewSize,
    previewTop,
    inputCenterY,
  };
}

function toggleWidgetAudience(widget) {
  if (!widget) return;
  widget.showForUsers = !widget.showForUsers;
}

function startWebcamLoop() {
  if (webcamRaf) cancelAnimationFrame(webcamRaf);
  const step = () => {
    if (!webcam.enabled) {
      webcamRaf = null;
      return;
    }
    if (webcam.chromaEnabled && webcamCanvas.value && webcamVideo.value) {
      const ctx = webcamCanvas.value.getContext("2d");
      updateWebcamCanvasSize();
      drawChromaToCanvas(webcamVideo.value, webcamCanvas.value, ctx);
    }
    webcamRaf = requestAnimationFrame(step);
  };
  webcamRaf = requestAnimationFrame(step);
}

function stopWebcamLoop() {
  if (webcamRaf) cancelAnimationFrame(webcamRaf);
  webcamRaf = null;
}

function startRecordingLoop() {
  if (recordingRaf) cancelAnimationFrame(recordingRaf);
  const step = () => {
    if (!isRecording.value && !isLiveBroadcasting.value) {
      recordingRaf = null;
      return;
    }
    renderRecordingFrame();
    recordingRaf = requestAnimationFrame(step);
  };
  recordingRaf = requestAnimationFrame(step);
}

function stopRecordingLoop() {
  if (isLiveBroadcasting.value) return;
  if (recordingRaf) cancelAnimationFrame(recordingRaf);
  recordingRaf = null;
}

function startLivePreviewLoop() {
  if (livePreviewRaf) cancelAnimationFrame(livePreviewRaf);
  const step = () => {
    if (!livePreviewWindow || livePreviewWindow.closed) {
      livePreviewRaf = null;
      return;
    }
    renderRecordingFrame();
    livePreviewRaf = requestAnimationFrame(step);
  };
  livePreviewRaf = requestAnimationFrame(step);
}

function stopLivePreviewLoop() {
  if (livePreviewRaf) cancelAnimationFrame(livePreviewRaf);
  livePreviewRaf = null;
  if (!isRecording.value && !isLiveBroadcasting.value) {
    isPreviewingRecording.value = false;
  }
}

function toggleRecordingPause() {
  if (!state.recorder || !isRecording.value) return;
  if (recordingPaused.value) {
    state.recorder.resume();
    recordingPaused.value = false;
    startRecordingTimer();
    sendAudacityCommand("resume");
  } else {
    state.recorder.pause();
    recordingPaused.value = true;
    pauseRecordingTimer();
    sendAudacityCommand("pause");
  }
}

async function toggleRecordings() {
  if (isRecording.value) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startLiveBroadcast() {
  if (isLiveBroadcasting.value) return;
  const rtmpUrl = buildLiveRtmpUrl();
  if (!rtmpUrl) {
    showToast("RTMP URL or stream key missing", "error");
    return;
  }
  if (!liveRelayUrl.value) {
    showToast("Relay URL missing", "error");
    return;
  }
  saveLiveSettings();
  liveStatus.value = "Connecting";
  isLiveBroadcasting.value = true;

  try {
    setLiveRecordSize(true);
    await ensureAvPermissions();
    if (liveSocket) {
      liveSocket.close();
      liveSocket = null;
    }
    liveSocket = new WebSocket(liveRelayUrl.value);
    liveSocket.binaryType = "arraybuffer";
    const socketReady = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Live relay connection timeout"));
      }, 5000);
      liveSocket.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      liveSocket.onerror = () => {
        clearTimeout(timeout);
        liveStatus.value = "Error";
        showToast("Live relay connection failed", "error");
        stopLiveBitrateMeter();
        reject(new Error("Live relay connection failed"));
      };
    });
    liveSocket.onclose = () => {
      if (isLiveBroadcasting.value) {
        liveStatus.value = "Disconnected";
      }
      stopLiveBitrateMeter();
    };
    await socketReady;

    const fps = recordingSettings.value.fps || 30;
    const captureCanvas =
      recordCompositeCanvas || recordCanvas || inkCanvas.value;
    const canvasStream = captureCanvas.captureStream(fps);
    liveOwnsAudio = false;
    await initLiveAudioPipeline();
    if (avControls.micEnabled) {
      if (!micPreviewStream) {
        await startMicPreview();
      }
      liveAudioStream = micPreviewStream;
      if (!liveAudioStream?.getAudioTracks()?.length) {
        showToast("No audio track from mic", "warn");
      }
      setMicEnabled(true, liveAudioStream);
      setMicPaused(false);
      attachLiveAudioSource(liveAudioStream);
      if (liveAudioGain) liveAudioGain.gain.value = 1;
    } else if (liveAudioGain) {
      liveAudioGain.gain.value = 0;
    }
    liveStream = new MediaStream();
    canvasStream
      .getVideoTracks()
      .forEach((track) => liveStream.addTrack(track));
    if (liveAudioDestination?.stream?.getAudioTracks?.().length) {
      const track = liveAudioDestination.stream.getAudioTracks()[0];
      liveStream.addTrack(track);
    } else {
      const silentTrack = createSilentAudioTrack();
      if (silentTrack) liveStream.addTrack(silentTrack);
    }
    if (liveAudioDestination?.stream?.getAudioTracks?.().length) {
      const audioOnlyStream = liveAudioDestination.stream;
      const audioMimeType = MediaRecorder.isTypeSupported(
        "audio/webm;codecs=opus",
      )
        ? "audio/webm;codecs=opus"
        : pickAudioMimeType();
      if (!audioMimeType) {
        liveAudioMeterStatus.value = "unsupported";
        showToast("Audio meter unsupported in this browser", "warn");
      } else {
        liveAudioMeterRecorder = new MediaRecorder(audioOnlyStream, {
          mimeType: audioMimeType || undefined,
          audioBitsPerSecond: 192_000,
        });
        liveAudioMeterRecorder.ondataavailable = async (evt) => {
          if (!evt.data || !evt.data.size) return;
          const buffer = await evt.data.arrayBuffer();
          liveAudioBytesSent += buffer.byteLength;
        };
        liveAudioMeterRecorder.onerror = () => {
          liveAudioMeterStatus.value = "error";
        };
        liveAudioMeterRecorder.start(1000);
      }
    } else {
      liveAudioMeterStatus.value = "no-audio";
    }
    startRecordingLoop();
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
      ? "video/webm;codecs=vp8,opus"
      : pickMimeType();
    liveRecorder = new MediaRecorder(liveStream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: Math.round(
        (recordingSettings.value.videoMbps || 3) * 1_000_000,
      ),
      audioBitsPerSecond: 192_000,
    });
    liveRecorder.ondataavailable = async (evt) => {
      if (!evt.data || !evt.data.size) return;
      if (!liveSocket || liveSocket.readyState !== WebSocket.OPEN) return;
      const buffer = await evt.data.arrayBuffer();
      liveSocket.send(buffer);
      liveBytesSent += buffer.byteLength;
    };
    liveRecorder.onstop = () => {
      liveStatus.value = "Idle";
    };
    const relayReady = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Relay did not acknowledge start"));
      }, 5000);
      liveSocket.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.type === "ready") {
            clearTimeout(timeout);
            resolve();
          }
        } catch {
          // ignore non-JSON
        }
      };
      liveSocket?.send(JSON.stringify({ type: "start", rtmpUrl, mimeType }));
    });
    await relayReady;
    liveStatus.value = "Live";
    startLiveBitrateMeter();
    liveRecorder.start(250);
  } catch (err) {
    console.error("Failed to start live broadcast", err);
    showToast("Failed to start live broadcast", "error");
    stopLiveBroadcast();
  }
}

function stopLiveBroadcast() {
  if (!isLiveBroadcasting.value) return;
  isLiveBroadcasting.value = false;
  liveStatus.value = "Stopping";
  stopLiveBitrateMeter();
  stopLiveAudioBitrateMeter();
  if (liveRecorder && liveRecorder.state !== "inactive") {
    liveRecorder.stop();
  }
  liveRecorder = null;
  if (liveAudioMeterRecorder && liveAudioMeterRecorder.state !== "inactive") {
    liveAudioMeterRecorder.stop();
  }
  liveAudioMeterRecorder = null;
  if (liveStream) {
    liveStream.getTracks().forEach((track) => track.stop());
  }
  liveStream = null;
  if (liveAudioStream && liveOwnsAudio) {
    liveAudioStream.getTracks().forEach((track) => track.stop());
  }
  liveAudioStream = null;
  liveOwnsAudio = false;
  if (liveSilentContext) {
    liveSilentContext.close();
  }
  liveSilentContext = null;
  if (liveAudioContext) {
    liveAudioContext.close();
  }
  liveAudioContext = null;
  liveAudioDestination = null;
  liveAudioSource = null;
  liveAudioGain = null;
  if (liveSocket && liveSocket.readyState === WebSocket.OPEN) {
    liveSocket.send(JSON.stringify({ type: "stop" }));
  }
  if (liveSocket) {
    liveSocket.close();
  }
  liveSocket = null;
  setLiveRecordSize(false);
  stopRecordingLoop();
  if (liveStopTimer) clearTimeout(liveStopTimer);
  liveStopTimer = setTimeout(() => {
    if (!isLiveBroadcasting.value) liveStatus.value = "Idle";
  }, 400);
}

function toggleLiveBroadcast() {
  if (isLiveBroadcasting.value) {
    stopLiveBroadcast();
  } else {
    startLiveBroadcast();
  }
}

async function refreshLiveAudioTrack() {
  if (!isLiveBroadcasting.value || !liveStream) return;
  try {
    if (!avControls.micEnabled) {
      if (liveAudioGain) liveAudioGain.gain.value = 0;
      return;
    }
    if (!micPreviewStream || !isAudioActive(micPreviewStream)) {
      await startMicPreview();
    }
    liveAudioStream = micPreviewStream;
    attachLiveAudioSource(liveAudioStream);
    if (liveAudioGain) liveAudioGain.gain.value = 1;
    setMicPaused(false);
  } catch (err) {
    console.warn("Failed to refresh live audio", err);
    showToast("Failed to switch live audio device", "error");
  }
}

async function startRecording() {
  if (isRecording.value) return;
  const fps = recordingSettings.value.fps || 30;
  const videoBps = Math.round(
    (recordingSettings.value.videoMbps || 3) * 1_000_000,
  );
  try {
    resetRecordingTimer();
    recordingFileHandle = null;
    recordingFileStream = null;
    recordingWriteChain = null;
    recordingWriteFailed = false;
    recordingSaveStatus.value = "";
    if (recordingSaveToDisk.value && !("showDirectoryPicker" in window)) {
      console.warn("File System Access API not supported, using IndexedDB");
      recordingSaveToDisk.value = false;
      showToast("Save to disk not supported, using IndexedDB", "warn");
    }
    const captureCanvas =
      recordCompositeCanvas || recordCanvas || inkCanvas.value;
    const canvasStream = captureCanvas.captureStream(fps);
    let audioStream = null;
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: micConstraints.value,
      });
      setMicEnabled(avControls.micEnabled, audioStream);
      loadDevices();
      startMicMeter(audioStream);
    } catch (err) {
      console.warn("Mic access denied or unavailable", err);
    }
    const mixedStream = new MediaStream();
    canvasStream
      .getVideoTracks()
      .forEach((track) => mixedStream.addTrack(track));
    if (audioStream) {
      audioStream
        .getAudioTracks()
        .forEach((track) => mixedStream.addTrack(track));
    }
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(mixedStream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: videoBps,
      audioBitsPerSecond: 128_000,
    });
    const chunks = [];
    if (recordingSaveToDisk.value && "showDirectoryPicker" in window) {
      try {
        const dirHandle = await ensureRecordingDirHandle();
        if (!dirHandle) throw new Error("No folder selected");
        const now = new Date();
        const filename = `Recording-${now
          .toISOString()
          .replace(/[:.]/g, "-")}.webm`;
        recordingFileHandle = await dirHandle.getFileHandle(filename, {
          create: true,
        });
        recordingFileStream = await recordingFileHandle.createWritable();
        recordingSaveStatus.value = "Saving to disk";
      } catch (err) {
        console.warn(
          "Save to disk canceled or failed, falling back to IDB",
          err,
        );
        recordingSaveToDisk.value = false;
        showToast("Save to disk canceled, using IndexedDB", "warn");
      }
    }
    recorder.ondataavailable = (evt) => {
      if (!evt.data || !evt.data.size) return;
      if (recordingFileStream && !recordingWriteFailed) {
        if (!recordingWriteChain) recordingWriteChain = Promise.resolve();
        recordingWriteChain = recordingWriteChain
          .then(() => recordingFileStream.write(evt.data))
          .catch((err) => {
            console.error("Recording write failed", err);
            recordingWriteFailed = true;
            showToast("Disk write failed, falling back to memory", "warn");
            chunks.push(evt.data);
          });
      } else {
        chunks.push(evt.data);
      }
    };
    recorder.onstop = async () => {
      if (recordingFileStream && !recordingWriteFailed) {
        try {
          if (recordingWriteChain) await recordingWriteChain;
          await recordingFileStream.close();
          recordingSaveStatus.value = "Saved to disk";
          lastRecordingFileHandle = recordingFileHandle;
          showActionToast(
            "Recording saved to disk",
            "Open",
            openLastRecording,
            "success",
          );
        } catch (err) {
          console.error("Failed to write recording to disk", err);
          showToast("Failed to save recording to disk", "error");
        } finally {
          recordingFileStream = null;
          recordingFileHandle = null;
        }
        return;
      }
      if (recordingFileStream && recordingWriteFailed) {
        try {
          await recordingFileStream.close();
        } catch (err) {
          console.warn("Failed to close recording stream", err);
        } finally {
          recordingFileStream = null;
          recordingFileHandle = null;
        }
      }
      const blob = new Blob(chunks, { type: mimeType || "video/webm" });
      const now = new Date();
      const record = {
        id: `rec-${now.getTime()}`,
        name: `Recording ${now.toLocaleString()}`,
        createdAt: now.toLocaleString(),
        createdAtTs: now.getTime(),
        size: blob.size,
        mimeType: blob.type,
        blob,
      };
      await saveRecording(record);
    };
    recorder.start(1000);
    isRecording.value = true;
    requestOverlay();
    startRecordingLoop();
    startRecordingTimer();
    sendAudacityCommand("start").then((ok) => {
      if (ok) audacityRecording.value = true;
    });
    if (webcam.enabled && webcam.chromaEnabled) startWebcamLoop();
    state.recorder = recorder;
    state.recordingStream = mixedStream;
    state.recordingAudio = audioStream;
  } catch (err) {
    console.error("Failed to start recording", err);
  }
}

function stopRecording() {
  if (!isRecording.value || !state.recorder) return;
  state.recorder.stop();
  state.recordingStream?.getTracks()?.forEach((t) => t.stop());
  state.recordingAudio?.getTracks()?.forEach((t) => t.stop());
  state.recorder = null;
  state.recordingStream = null;
  state.recordingAudio = null;
  isRecording.value = false;
  recordingPaused.value = false;
  if (!recordingSaveToDisk.value) {
    recordingSaveStatus.value = "";
  } else {
    setTimeout(() => {
      recordingSaveStatus.value = "";
    }, 4000);
  }
  requestOverlay();
  stopRecordingLoop();
  stopRecordingTimer();
  stopMicMeter();
  sendAudacityCommand("stop").then((ok) => {
    if (ok) audacityRecording.value = false;
  });
}

function downloadRecording(rec) {
  const url = URL.createObjectURL(rec.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${rec.name}.webm`;
  link.click();
  URL.revokeObjectURL(url);
}

function getRecordingUrl(rec) {
  if (!rec?.blob) return "";
  if (!recordingUrls.has(rec.id)) {
    recordingUrls.set(rec.id, URL.createObjectURL(rec.blob));
  }
  return recordingUrls.get(rec.id);
}

function openRecordingPreview(rec) {
  previewRecording.value = rec;
}

function closeRecordingPreview() {
  previewRecording.value = null;
}

function openLivePreview() {
  if (livePreviewWindow && !livePreviewWindow.closed) {
    livePreviewWindow.focus();
    return;
  }
  const streamSource = recordCompositeCanvas || recordCanvas || inkCanvas.value;
  if (!streamSource?.captureStream) return;
  isPreviewingRecording.value = true;
  renderRecordingFrame();
  const stream = streamSource.captureStream(recordingSettings.value.fps || 30);
  const w = window.open("", "WieTeachLivePreview", "width=900,height=520");
  if (!w) return;
  livePreviewWindow = w;
  w.document.title = "WieTeach Live Preview";
  w.document.body.style.margin = "0";
  w.document.body.style.background = "#0f172a";
  const video = w.document.createElement("video");
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.width = "100%";
  video.style.height = "100%";
  video.style.objectFit = "contain";
  w.document.body.appendChild(video);
  video.srcObject = stream;
  w.addEventListener("beforeunload", () => {
    stream.getTracks().forEach((t) => t.stop());
    livePreviewWindow = null;
    isPreviewingRecording.value = false;
    stopLivePreviewLoop();
  });
  if (webcam.enabled && webcam.chromaEnabled) startWebcamLoop();
  startLivePreviewLoop();
}

function resizeCanvases() {
  const canvas = inkCanvas.value;
  if (!canvas || !canvasStack.value) return;
  if (boardStage.value) {
    const stageRect = boardStage.value.getBoundingClientRect();
    const padding = 0;
    const availW = Math.max(1, stageRect.width - padding);
    const availH = Math.max(1, stageRect.height - padding);
    const targetW = Math.min(availW, (availH * 16) / 9);
    const targetH = (targetW * 9) / 16;
    canvasStack.value.style.width = `${Math.floor(targetW)}px`;
    canvasStack.value.style.height = `${Math.floor(targetH)}px`;
  }
  const rect = canvasStack.value.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));

  const overlay = overlayCanvas.value;
  overlay.width = canvas.width;
  overlay.height = canvas.height;
  const background = backgroundCanvas.value;
  background.width = canvas.width;
  background.height = canvas.height;
  if (recordCanvas) {
    recordCanvas.width = canvas.width;
    recordCanvas.height = canvas.height;
  }
  if (recordCompositeCanvas) {
    const desiredWidth = Math.min(RECORD_MAX_WIDTH, canvas.width);
    const desiredHeight = Math.min(RECORD_MAX_HEIGHT, canvas.height);
    if (
      recordCompositeCanvas.width !== desiredWidth ||
      recordCompositeCanvas.height !== desiredHeight
    ) {
      recordCompositeCanvas.width = desiredWidth;
      recordCompositeCanvas.height = desiredHeight;
    }
    recordSize.width = recordCompositeCanvas.width;
    recordSize.height = recordCompositeCanvas.height;
  }

  inkCtx.value.setTransform(ratio, 0, 0, ratio, 0, 0);
  bgCtx.value.setTransform(ratio, 0, 0, ratio, 0, 0);
  overlayCtx.value.setTransform(ratio, 0, 0, ratio, 0, 0);
  if (recordCtx) {
    recordCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  updateDockMetrics();
  clampWidgetsToStage();
  if (
    webcam.enabled &&
    !webcam.dragging &&
    !webcam.resizing &&
    !webcam.userPlaced
  ) {
    positionWebcamDefault();
  }
  redrawAll();
}

function updateDockMetrics() {
  if (!boardStage.value || !bottomDock.value) return;
  const boardRect = boardStage.value.getBoundingClientRect();
  const dockRect = bottomDock.value.getBoundingClientRect();
  if (!dockRect.width || !dockRect.height) return;
  const centerX = dockRect.left + dockRect.width / 2 - boardRect.left;
  const gap = 10;
  const bottom = Math.max(64, boardRect.bottom - dockRect.top + gap);
  boardStage.value.style.setProperty("--dock-center-x", `${centerX}px`);
  boardStage.value.style.setProperty("--dock-popover-bottom", `${bottom}px`);

  if (leftDock.value) {
    const leftRect = leftDock.value.getBoundingClientRect();
    const leftX = leftRect.right - boardRect.left + 12;
    const leftY = leftRect.top + leftRect.height / 2 - boardRect.top;
    const leftColumn = leftRect.left - boardRect.left;
    boardStage.value.style.setProperty("--left-dock-x", `${leftX}px`);
    boardStage.value.style.setProperty("--left-dock-y", `${leftY}px`);
    boardStage.value.style.setProperty("--left-dock-left", `${leftColumn}px`);
  }
}

function getPointFromEvent(e) {
  const rect = inkCanvas.value.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
    pressure: e.pressure || 0.5,
  };
}

function applyStrokeStyle(ctx, stroke) {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = stroke.size;
  ctx.strokeStyle = stroke.color;
  ctx.fillStyle = stroke.color;
  ctx.globalAlpha = stroke.alpha;
  ctx.globalCompositeOperation = stroke.composite;
}

function drawDot(ctx, stroke, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawSegment(ctx, x0, y0, x1, y1, x2, y2) {
  const mx1 = (x0 + x1) * 0.5;
  const my1 = (y0 + y1) * 0.5;
  const mx2 = (x1 + x2) * 0.5;
  const my2 = (y1 + y2) * 0.5;
  ctx.beginPath();
  ctx.moveTo(mx1, my1);
  ctx.quadraticCurveTo(x1, y1, mx2, my2);
  ctx.stroke();
}

function startStroke(point) {
  const base = TOOL_DEFAULTS[tool.value];
  const stroke = {
    id: `stroke-${strokeCounter.value++}`,
    type: "path",
    tool: tool.value,
    color: tool.value === "eraser" ? "#000000" : color.value,
    size: size.value,
    alpha: base.alpha,
    composite: base.composite,
    points: [],
    bbox: { minX: point.x, minY: point.y, maxX: point.x, maxY: point.y },
  };

  stroke.points.push(point.x, point.y);
  applyStrokeStyle(inkCtx.value, stroke);
  if (tool.value === "pen" || tool.value === "highlighter") {
    inkCtx.value.globalCompositeOperation = "source-over";
  }
  if (tool.value === "eraser") {
    inkCtx.value.globalCompositeOperation = "destination-out";
  }

  const slide = getActiveSlide();
  slide.strokes.push(stroke);
  ensureHistory(slide);
  slide.redoHistory = [];
  return stroke;
}

function flushStroke() {
  state.needsFlush = false;
  if (!state.isDrawing || !currentStroke) return;

  const pts = state.pendingPoints;
  state.pendingPoints = [];
  if (!pts.length) return;

  // Ensure eraser always uses destination-out while drawing.
  if (currentStroke.tool === "eraser") {
    inkCtx.value.globalCompositeOperation = "destination-out";
  } else {
    inkCtx.value.globalCompositeOperation = "source-over";
  }
  if (recordCtx) {
    applyStrokeStyle(recordCtx, currentStroke);
    recordCtx.globalCompositeOperation =
      currentStroke.tool === "eraser" ? "destination-out" : "source-over";
  }

  const data = currentStroke.points;
  for (let i = 0; i < pts.length; i += 2) {
    data.push(pts[i], pts[i + 1]);
    if (currentStroke.bbox) {
      currentStroke.bbox.minX = Math.min(currentStroke.bbox.minX, pts[i]);
      currentStroke.bbox.minY = Math.min(currentStroke.bbox.minY, pts[i + 1]);
      currentStroke.bbox.maxX = Math.max(currentStroke.bbox.maxX, pts[i]);
      currentStroke.bbox.maxY = Math.max(currentStroke.bbox.maxY, pts[i + 1]);
    }
    const len = data.length;
    if (len === 2) {
      drawDot(inkCtx.value, currentStroke, data[0], data[1]);
      if (recordCtx) drawDot(recordCtx, currentStroke, data[0], data[1]);
      continue;
    }
    if (len >= 6) {
      const x0 = data[len - 6];
      const y0 = data[len - 5];
      const x1 = data[len - 4];
      const y1 = data[len - 3];
      const x2 = data[len - 2];
      const y2 = data[len - 1];
      drawSegment(inkCtx.value, x0, y0, x1, y1, x2, y2);
      if (recordCtx) drawSegment(recordCtx, x0, y0, x1, y1, x2, y2);
    }
  }
}

function scheduleFlush() {
  if (state.needsFlush) return;
  state.needsFlush = true;
  requestAnimationFrame(flushStroke);
}

function drawBootstrapIcon(ctx, iconStroke) {
  // Render a Bootstrap icon from the icon library
  if (!iconStroke.icon) return;

  const icon = getIconById(iconStroke.icon);
  if (!icon || !icon.paths || icon.paths.length === 0) return;

  const paths = getIconPaths(iconStroke.icon);
  if (!paths.length) return;

  ctx.save();
  ctx.globalAlpha = iconStroke.alpha || 1;
  ctx.globalCompositeOperation = "source-over";

  // Translate to center for rotation
  const centerX = iconStroke.x + iconStroke.width / 2;
  const centerY = iconStroke.y + iconStroke.height / 2;

  ctx.translate(centerX, centerY);
  if (iconStroke.rotation) {
    ctx.rotate((iconStroke.rotation * Math.PI) / 180);
  }
  ctx.translate(-centerX, -centerY);

  // Draw the icon paths scaled to fit the dimensions - use uniform scale to maintain aspect ratio
  const scale = Math.min(
    iconStroke.width / ICON_VIEWBOX,
    iconStroke.height / ICON_VIEWBOX,
  );
  const offsetX = (iconStroke.width - scale * ICON_VIEWBOX) / 2;
  const offsetY = (iconStroke.height - scale * ICON_VIEWBOX) / 2;

  ctx.translate(iconStroke.x + offsetX, iconStroke.y + offsetY);
  ctx.scale(scale, scale);

  const fillColor = iconStroke.fillColor ?? iconStroke.color ?? "#000000";
  const strokeColor = iconStroke.strokeColor;
  ctx.fillStyle = fillColor;
  if (fillColor) {
    paths.forEach((path) => ctx.fill(path));
  }
  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = Math.max(0.5, 2 / scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    paths.forEach((path) => ctx.stroke(path));
  }

  ctx.restore();
}

function renderStroke(ctx, stroke) {
  // Handle Bootstrap icon shapes (new type)
  if (stroke.type === STROKE_TYPES.ICON) {
    drawBootstrapIcon(ctx, stroke);
    return;
  }

  if (stroke.type === STROKE_TYPES.SHAPE) {
    if (stroke.shape === SHAPE_TYPES.ICON) {
      drawIconShape(
        ctx,
        stroke.iconId || ICON_LIBRARY[0]?.id || "star",
        { x: stroke.x, y: stroke.y, w: stroke.w, h: stroke.h },
        stroke,
      );
      return;
    }
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = stroke.size;
    ctx.strokeStyle = stroke.color;
    ctx.fillStyle = stroke.fillColor || "transparent";
    ctx.globalAlpha = stroke.alpha;
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    if (stroke.shape === "line") {
      ctx.moveTo(stroke.x, stroke.y);
      ctx.lineTo(stroke.x2, stroke.y2);
      ctx.stroke();
    } else if (stroke.shape === SHAPE_TYPES.ELLIPSE) {
      const cx = stroke.x + stroke.w / 2;
      const cy = stroke.y + stroke.h / 2;
      ctx.ellipse(
        cx,
        cy,
        Math.abs(stroke.w / 2),
        Math.abs(stroke.h / 2),
        0,
        0,
        Math.PI * 2,
      );
      if (stroke.fillColor) ctx.fill();
      ctx.stroke();
    } else {
      ctx.rect(stroke.x, stroke.y, stroke.w, stroke.h);
      if (stroke.fillColor) ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (!stroke.points || stroke.points.length === 0) return;
  applyStrokeStyle(ctx, stroke);
  ctx.globalCompositeOperation =
    stroke.tool === "eraser" ? "destination-out" : "source-over";
  const pts = stroke.points;
  if (pts.length === 2) {
    drawDot(ctx, stroke, pts[0], pts[1]);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length - 2; i += 2) {
    const x1 = pts[i];
    const y1 = pts[i + 1];
    const x2 = pts[i + 2];
    const y2 = pts[i + 3];
    const mx = (x1 + x2) * 0.5;
    const my = (y1 + y2) * 0.5;
    ctx.quadraticCurveTo(x1, y1, mx, my);
  }
  ctx.stroke();
}

function drawBackground(ctx, slide, width, height) {
  if (slide.backgroundPattern) {
    ctx.fillStyle = slide.backgroundColor || "#111111";
    ctx.fillRect(0, 0, width, height);
    drawTemplatePattern(ctx, slide.backgroundPattern, width, height);
    return;
  }
  if (slide.backgroundBitmap) {
    const bw = slide.backgroundBitmap.width;
    const bh = slide.backgroundBitmap.height;
    const scale = Math.min(width / bw, height / bh);
    const drawW = bw * scale;
    const drawH = bh * scale;
    const dx = (width - drawW) * 0.5;
    const dy = (height - drawH) * 0.5;
    ctx.drawImage(slide.backgroundBitmap, dx, dy, drawW, drawH);
    return;
  }
  if (slide.backgroundImage) {
    const img = getBackgroundImage(slide.backgroundImage);
    if (img && img.complete && img.naturalWidth) {
      const scale = Math.min(
        width / img.naturalWidth,
        height / img.naturalHeight,
      );
      const drawW = img.naturalWidth * scale;
      const drawH = img.naturalHeight * scale;
      const dx = (width - drawW) * 0.5;
      const dy = (height - drawH) * 0.5;
      ctx.drawImage(img, dx, dy, drawW, drawH);
      return;
    }
  }
  ctx.fillStyle = slide.backgroundColor || "#111111";
  ctx.fillRect(0, 0, width, height);
}

function getBackgroundImage(src) {
  if (!src) return null;
  if (bgImageCache.has(src)) return bgImageCache.get(src);
  const img = new Image();
  img.onload = () => {
    bgImageCache.set(src, img);
    redrawAll();
    renderAllThumbnails();
  };
  img.src = src;
  bgImageCache.set(src, img);
  return img;
}

function redrawAll() {
  const rect = inkCanvas.value.getBoundingClientRect();
  inkCtx.value.clearRect(0, 0, rect.width, rect.height);
  bgCtx.value.clearRect(0, 0, rect.width, rect.height);
  if (recordCtx) {
    recordCtx.clearRect(0, 0, rect.width, rect.height);
  }
  const slide = getActiveSlide();
  if (!slide) return;
  bgCtx.value.save();
  drawBackground(bgCtx.value, slide, rect.width, rect.height);
  bgCtx.value.restore();
  if (recordCtx) {
    recordCtx.save();
    drawBackground(recordCtx, slide, rect.width, rect.height);
    recordCtx.restore();
  }
  for (const stroke of slide.strokes) {
    renderStroke(inkCtx.value, stroke);
    if (recordCtx) renderStroke(recordCtx, stroke);
  }
  updateThumbnail();
  if (state.selectionIds.length) {
    const slideStrokes = new Set(slide.strokes.map((s) => s.id));
    state.selectionIds = state.selectionIds.filter((id) =>
      slideStrokes.has(id),
    );
    updateSelectionBounds();
  }
}

function updateThumbnail() {
  const slide = getActiveSlide();
  if (!slide) return;
  const thumbCanvas = document.createElement("canvas");
  const targetW = 200;
  const targetH = 150;
  thumbCanvas.width = targetW;
  thumbCanvas.height = targetH;
  const tctx = thumbCanvas.getContext("2d");
  tctx.clearRect(0, 0, targetW, targetH);
  drawBackground(tctx, slide, targetW, targetH);
  tctx.drawImage(inkCanvas.value, 0, 0, targetW, targetH);
  slide.thumb = thumbCanvas.toDataURL("image/png");
}

function renderSlideToThumb(slide) {
  const rect = inkCanvas.value.getBoundingClientRect();
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = rect.width;
  tempCanvas.height = rect.height;
  const tctx = tempCanvas.getContext("2d");
  drawBackground(tctx, slide, tempCanvas.width, tempCanvas.height);
  for (const stroke of slide.strokes) {
    renderStroke(tctx, stroke);
  }
  const thumbCanvas = document.createElement("canvas");
  const targetW = 200;
  const targetH = 150;
  thumbCanvas.width = targetW;
  thumbCanvas.height = targetH;
  const thumbCtx = thumbCanvas.getContext("2d");
  drawBackground(thumbCtx, slide, targetW, targetH);
  thumbCtx.drawImage(tempCanvas, 0, 0, targetW, targetH);
  slide.thumb = thumbCanvas.toDataURL("image/png");
}

function renderAllThumbnails() {
  slides.value.forEach((slide) => renderSlideToThumb(slide));
}

function startSlideTransition(onMidpoint) {
  slideTransition.token += 1;
  const token = slideTransition.token;
  slideTransition.visible = true;
  slideTransition.phase = "in";
  setTimeout(() => {
    if (token !== slideTransition.token) return;
    if (onMidpoint) onMidpoint();
    slideTransition.phase = "out";
  }, 40);
  setTimeout(() => {
    if (token !== slideTransition.token) return;
    slideTransition.visible = false;
    slideTransition.phase = "";
  }, 50);
}

function switchSlide(index) {
  if (
    index === currentSlideIndex.value ||
    index < 0 ||
    index >= slides.value.length
  )
    return;
  updateThumbnail();
  if (!SLIDE_TRANSITION_ENABLED) {
    currentSlideIndex.value = index;
    clearSelection();
    redrawAll();
    markDirty();
    return;
  }
  startSlideTransition(() => {
    currentSlideIndex.value = index;
    clearSelection();
    redrawAll();
    markDirty();
  });
}

function addSlide() {
  slides.value.push(createSlide());
  currentSlideIndex.value = slides.value.length - 1;
  clearSelection();
  redrawAll();
  markDirty();
}

function prevSlide() {
  switchSlide(currentSlideIndex.value - 1);
}

function nextSlide() {
  switchSlide(currentSlideIndex.value + 1);
}

function clearSlides() {
  slides.value = [createSlide()];
  currentSlideIndex.value = 0;
  clearSelection();
  redrawAll();
  markDirty();
}

function undo() {
  const slide = getActiveSlide();
  if (!slide || !slide.history?.length) return;
  const cmd = slide.history.pop();
  applyCommand(slide, cmd, "undo");
  slide.redoHistory.push(cmd);
  redrawAll();
  markDirty();
}

function redo() {
  const slide = getActiveSlide();
  if (!slide || !slide.redoHistory?.length) return;
  const cmd = slide.redoHistory.pop();
  applyCommand(slide, cmd, "do");
  slide.history.push(cmd);
  redrawAll();
  markDirty();
}

function setTool(nextTool) {
  tool.value = nextTool;
  const defaults = TOOL_DEFAULTS[nextTool];
  if (defaults && defaults.size) {
    size.value = defaults.size;
  }
  if (nextTool !== "select") {
    clearSelection();
  }
  if (nextTool !== "shape") {
    showShapePopover.value = false;
  }
  if (nextTool !== "pen") {
    showPenPopover.value = false;
  }
  if (nextTool !== "eraser") {
    showEraserPopover.value = false;
  }
  showSettingsPopover.value = false;
  showWidgetPopover.value = false;
  if (nextTool !== "fill") {
    showTemplatePopover.value = false;
  }
  requestOverlay();
}

function setColor(nextColor) {
  color.value = nextColor;
}

function setSize(nextSize) {
  size.value = nextSize;
}

function nudgeSize(delta, min = 1, max = 40) {
  const next = Math.min(max, Math.max(min, Math.round(size.value + delta)));
  size.value = next;
}

function setPenMode(mode) {
  setTool(mode);
  showPenPopover.value = true;
  showEraserPopover.value = false;
}

function setEraserMode(mode) {
  eraserMode.value = mode;
  setTool("eraser");
  showEraserPopover.value = true;
  showPenPopover.value = false;
}

function toggleColorPopover() {
  showColorPopover.value = !showColorPopover.value;
  if (showColorPopover.value) {
    showShapePopover.value = false;
    showPenPopover.value = false;
    showEraserPopover.value = false;
    showSettingsPopover.value = false;
    showWidgetPopover.value = false;
  }
}

function toggleFillPopover() {
  if (tool.value !== "fill") {
    setTool("fill");
  }
  showColorPopover.value = !showColorPopover.value;
  if (showColorPopover.value) {
    showShapePopover.value = false;
    showPenPopover.value = false;
    showEraserPopover.value = false;
    showSettingsPopover.value = false;
    showWidgetPopover.value = false;
  }
}

function toggleSlides() {
  showSlidesPanel.value = !showSlidesPanel.value;
}

function toggleSettingsPopover() {
  showSettingsPopover.value = !showSettingsPopover.value;
  if (showSettingsPopover.value) {
    showShapePopover.value = false;
    showTemplatePopover.value = false;
    showColorPopover.value = false;
    showPenPopover.value = false;
    showEraserPopover.value = false;
    showWidgetPopover.value = false;
  }
}

function togglePenPopover() {
  if (tool.value !== "pen") {
    setTool("pen");
  }
  showPenPopover.value = !showPenPopover.value;
  if (showPenPopover.value) {
    showShapePopover.value = false;
    showTemplatePopover.value = false;
    showColorPopover.value = false;
    showEraserPopover.value = false;
    showSettingsPopover.value = false;
    showWidgetPopover.value = false;
  }
}

function toggleEraserPopover() {
  if (tool.value !== "eraser") {
    setTool("eraser");
  }
  showEraserPopover.value = !showEraserPopover.value;
  if (showEraserPopover.value) {
    showShapePopover.value = false;
    showTemplatePopover.value = false;
    showColorPopover.value = false;
    showPenPopover.value = false;
    showSettingsPopover.value = false;
    showWidgetPopover.value = false;
  }
}

function toggleTemplatePopover() {
  showTemplatePopover.value = !showTemplatePopover.value;
  if (showTemplatePopover.value) {
    showColorPopover.value = false;
    showShapePopover.value = false;
    showPenPopover.value = false;
    showEraserPopover.value = false;
    showSettingsPopover.value = false;
    showWidgetPopover.value = false;
  }
}

function toggleWidgetPopover() {
  showWidgetPopover.value = !showWidgetPopover.value;
  if (showWidgetPopover.value) {
    showColorPopover.value = false;
    showShapePopover.value = false;
    showTemplatePopover.value = false;
    showPenPopover.value = false;
    showEraserPopover.value = false;
    showSettingsPopover.value = false;
  }
}

function getWidgetBounds() {
  const rect = canvasStack.value?.getBoundingClientRect();
  if (!rect) {
    return { width: 0, height: 0, left: 0, top: 0 };
  }
  return {
    width: rect.width,
    height: rect.height,
    left: rect.left,
    top: rect.top,
  };
}

function clampWidgetToStage(widget) {
  const bounds = getWidgetBounds();
  if (!bounds.width || !bounds.height) return;
  const aspect = getWidgetAspect(widget);
  const minW = widget.minWidth || WIDGET_MIN_WIDTH;
  const minH = widget.minHeight || WIDGET_MIN_HEIGHT;
  if (widget.width < minW) {
    widget.width = minW;
    widget.height = widget.width / aspect;
  }
  if (widget.height < minH) {
    widget.height = minH;
    widget.width = widget.height * aspect;
  }
  if (widget.width > bounds.width) {
    widget.width = bounds.width;
    widget.height = widget.width / aspect;
  }
  if (widget.height > bounds.height) {
    widget.height = bounds.height;
    widget.width = widget.height * aspect;
  }
  const maxX = Math.max(0, bounds.width - widget.width);
  const maxY = Math.max(0, bounds.height - widget.height);
  widget.x = Math.max(0, Math.min(widget.x, maxX));
  widget.y = Math.max(0, Math.min(widget.y, maxY));
}

function clampValue(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function getWidgetStyle(widget) {
  const base = Math.max(1, Math.min(widget.width, widget.height));
  const qrSize =
    widget.type === "qr"
      ? getQrLayoutMetrics(widget.width, widget.height, 1).previewSize
      : null;
  return {
    left: `${widget.x}px`,
    top: `${widget.y}px`,
    width: `${widget.width}px`,
    height: `${widget.height}px`,
    "--widget-base": `${base}px`,
    "--widget-w": `${widget.width}px`,
    "--widget-h": `${widget.height}px`,
    "--widget-h-sw": `${widget.height + 100}px`,

    ...(qrSize ? { "--qr-size": `${qrSize}px` } : {}),
  };
}

function clampWidgetsToStage() {
  widgets.value.forEach((widget) => clampWidgetToStage(widget));
}

function createTimerState(durationMs) {
  return {
    durationMs,
    remainingMs: durationMs,
    running: false,
    lastTick: null,
    input: formatDuration(durationMs),
  };
}

function createStopwatchState() {
  return {
    elapsedMs: 0,
    running: false,
    lastTick: null,
    laps: [],
  };
}

function createQrState() {
  return {
    text: "",
    dataUrl: "",
    loading: false,
    debounce: null,
  };
}

function addWidget(type) {
  const bounds = getWidgetBounds();
  let base = { w: 300, h: 190, minW: 220, minH: 140 };
  if (type === "clock") {
    base = { w: 220, h: 140, minW: 200, minH: 130 };
  } else if (type === "timer") {
    base = { w: 300, h: 190, minW: 260, minH: 190 };
  } else if (type === "stopwatch") {
    base = { w: 280, h: 170, minW: 260, minH: 190 };
  } else if (type === "qr") {
    base = { w: 220, h: 220, minW: 200, minH: 200 };
  }
  const offset = widgets.value.length * 18;
  const startX = bounds.width ? (bounds.width - base.w) * 0.5 : 40;
  const startY = bounds.height ? (bounds.height - base.h) * 0.5 : 40;
  const widget = {
    id: `widget-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    x: startX + offset,
    y: startY + offset,
    width: base.w,
    height: base.h,
    aspect: type === "qr" ? 1 : base.w / base.h,
    minWidth: base.minW,
    minHeight: base.minH,
    dragging: false,
    resizing: false,
    showForUsers: false,
    timer: type === "timer" ? createTimerState(5 * 60 * 1000) : null,
    stopwatch: type === "stopwatch" ? createStopwatchState() : null,
    qr: type === "qr" ? createQrState() : null,
  };
  widgets.value.push(widget);
  activeWidgetId.value = widget.id;
  clampWidgetToStage(widget);
  showWidgetPopover.value = false;
  if (widget.type === "qr") {
    widget.qr.text = "https://forms.gle/429GFwj6uT2AaH4R7";
    scheduleQrUpdate(widget, true);
  }
}

function getWidgetTitle(widget) {
  if (!widget) return "Widget";
  if (widget.type === "clock") return "Clock";
  if (widget.type === "timer") return "Timer";
  if (widget.type === "stopwatch") return "Stopwatch";
  if (widget.type === "qr") return "QR code";
  return "Widget";
}

function getWidgetAspect(widget) {
  if (!widget) return 1;
  if (widget.type === "qr") return 1;
  return widget.aspect || widget.width / widget.height || 1;
}

function removeWidget(widgetId) {
  const idx = widgets.value.findIndex((widget) => widget.id === widgetId);
  if (idx === -1) return;
  const widget = widgets.value[idx];
  if (widget?.qr?.debounce) {
    clearTimeout(widget.qr.debounce);
  }
  widgets.value.splice(idx, 1);
  if (activeWidgetId.value === widgetId) {
    activeWidgetId.value =
      widgets.value.length > 0
        ? widgets.value[widgets.value.length - 1].id
        : null;
  }
}

function setTimerDuration(widget, durationMs) {
  const next = Math.max(0, durationMs || 0);
  widget.timer.durationMs = next;
  widget.timer.remainingMs = next;
  widget.timer.running = false;
  widget.timer.lastTick = null;
  widget.timer.input = formatDuration(next);
}

function applyTimerInput(widget) {
  const parsed = parseTimerInput(widget.timer.input);
  if (parsed === null) {
    widget.timer.input = formatDuration(widget.timer.durationMs);
    return;
  }
  setTimerDuration(widget, parsed);
}

function getTimerProgress(widget) {
  if (!widget?.timer?.durationMs) return 0;
  const elapsed = widget.timer.durationMs - widget.timer.remainingMs;
  return Math.min(1, Math.max(0, elapsed / widget.timer.durationMs));
}

function toggleTimer(widget) {
  if (!widget?.timer) return;
  if (widget.timer.running) {
    widget.timer.running = false;
    widget.timer.lastTick = null;
    return;
  }
  if (widget.timer.remainingMs <= 0) {
    widget.timer.remainingMs = widget.timer.durationMs;
  }
  widget.timer.running = true;
  widget.timer.lastTick = Date.now();
}

function resetTimer(widget) {
  if (!widget?.timer) return;
  setTimerDuration(widget, widget.timer.durationMs);
}

function formatStopwatch(ms) {
  return formatDuration(ms);
}

function toggleStopwatch(widget) {
  if (!widget?.stopwatch) return;
  if (widget.stopwatch.running) {
    widget.stopwatch.running = false;
    widget.stopwatch.lastTick = null;
    return;
  }
  widget.stopwatch.running = true;
  widget.stopwatch.lastTick = Date.now();
}

function lapStopwatch(widget) {
  if (!widget?.stopwatch) return;
  const count = widget.stopwatch.laps.length + 1;
  const prevTotal =
    widget.stopwatch.laps.length > 0
      ? widget.stopwatch.laps[widget.stopwatch.laps.length - 1].totalMs
      : 0;
  const totalMs = widget.stopwatch.elapsedMs;
  widget.stopwatch.laps.push({
    label: `Q${count}`,
    lapMs: Math.max(0, totalMs - prevTotal),
    totalMs,
  });
}

function resetStopwatch(widget) {
  if (!widget?.stopwatch) return;
  widget.stopwatch.elapsedMs = 0;
  widget.stopwatch.running = false;
  widget.stopwatch.lastTick = null;
  widget.stopwatch.laps = [];
}

function loadQrLib() {
  if (!qrLibPromise) {
    qrLibPromise = import("qrcode");
  }
  return qrLibPromise;
}

function scheduleQrUpdate(widget, immediate = false) {
  if (!widget?.qr) return;
  if (widget.qr.debounce) {
    clearTimeout(widget.qr.debounce);
    widget.qr.debounce = null;
  }
  if (immediate) {
    updateQrCode(widget);
    return;
  }
  widget.qr.debounce = setTimeout(() => {
    updateQrCode(widget);
  }, 250);
}

async function updateQrCode(widget) {
  if (!widget?.qr) return;
  const text = (widget.qr.text || "").trim();
  if (!text) {
    widget.qr.dataUrl = "";
    return;
  }
  widget.qr.loading = true;
  try {
    const { toDataURL } = await loadQrLib();
    widget.qr.dataUrl = await toDataURL(text, {
      margin: 1,
      width: 512,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
    if (widget.qr.dataUrl) {
      const img = new Image();
      img.onload = () => {
        qrImageCache.set(widget.qr.dataUrl, img);
      };
      img.src = widget.qr.dataUrl;
    }
  } catch (err) {
    console.warn("Failed to generate QR", err);
  } finally {
    widget.qr.loading = false;
  }
}

function updateWidgetTimers(now = Date.now()) {
  widgets.value.forEach((widget) => {
    if (widget.type === "timer" && widget.timer?.running) {
      const lastTick = widget.timer.lastTick || now;
      const delta = now - lastTick;
      if (delta > 0) {
        widget.timer.remainingMs = Math.max(
          0,
          widget.timer.remainingMs - delta,
        );
        widget.timer.lastTick = now;
        if (widget.timer.remainingMs <= 0) {
          widget.timer.remainingMs = 0;
          widget.timer.running = false;
        }
      }
    }
    if (widget.type === "stopwatch" && widget.stopwatch?.running) {
      const lastTick = widget.stopwatch.lastTick || now;
      const delta = now - lastTick;
      if (delta > 0) {
        widget.stopwatch.elapsedMs += delta;
        widget.stopwatch.lastTick = now;
      }
    }
  });
}

function startWidgetTicker() {
  if (widgetTickInterval) clearInterval(widgetTickInterval);
  widgetTickInterval = setInterval(() => {
    clockNow.value = new Date();
    updateWidgetTimers();
  }, 250);
}

function stopWidgetTicker() {
  if (!widgetTickInterval) return;
  clearInterval(widgetTickInterval);
  widgetTickInterval = null;
}

function updateWidgetTickerState() {
  if (!widgets.value.length) {
    stopWidgetTicker();
    return;
  }
  if (!widgetTickInterval) startWidgetTicker();
}

function setAudacityStatus(state, text) {
  audacityStatus.value = { state, text };
}

async function checkAudacityHealth() {
  if (!audacityBridgeUrl) {
    setAudacityStatus("missing", "Bridge not set");
    return;
  }
  if (!audacitySyncEnabled.value) {
    setAudacityStatus("off", "Sync off");
    return;
  }
  try {
    const res = await fetch(`${audacityBridgeUrl}/health`);
    const data = await res.json();
    if (data?.ok && data?.toExists && data?.fromExists) {
      setAudacityStatus("connected", "Connected");
    } else {
      setAudacityStatus("error", "Pipes missing");
    }
  } catch {
    setAudacityStatus("error", "Disconnected");
  }
}

function startAudacityHealthTimer() {
  if (audacityHealthTimer) clearInterval(audacityHealthTimer);
  audacityHealthTimer = setInterval(checkAudacityHealth, 3000);
  checkAudacityHealth();
}

function stopAudacityHealthTimer() {
  if (!audacityHealthTimer) return;
  clearInterval(audacityHealthTimer);
  audacityHealthTimer = null;
}

async function sendAudacityCommand(action) {
  const force = typeof action === "object" && action !== null;
  const payload = force ? action : { action };
  if (!audacityBridgeUrl) return false;
  if (!audacitySyncEnabled.value && !force) return false;
  try {
    const res = await fetch(`${audacityBridgeUrl}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Bridge error");
    return true;
  } catch (err) {
    if (!audacitySyncWarned) {
      audacitySyncWarned = true;
      showToast("Audacity sync unavailable", "warn");
    }
    return false;
  }
}

async function toggleAudacityRecording() {
  if (!audacityBridgeUrl) {
    showToast("Audacity bridge URL not set", "warn");
    return;
  }
  const next = !audacityRecording.value;
  const ok = await sendAudacityCommand({
    command: next ? "Record1stChoice" : "Stop",
  });
  if (ok) {
    audacityRecording.value = next;
  }
}

function onWidgetDragStart(widget, event) {
  if (event.button !== 0) return;
  if (event.target?.closest?.("button, input")) return;
  event.preventDefault();
  const bounds = getWidgetBounds();
  widget.dragging = true;
  activeWidgetId.value = widget.id;
  widgetDragState = {
    widget,
    offsetX: event.clientX - bounds.left - widget.x,
    offsetY: event.clientY - bounds.top - widget.y,
    bounds,
  };
  window.addEventListener("pointermove", onWidgetDragMove);
  window.addEventListener("pointerup", onWidgetDragEnd);
}

function onWidgetDragMove(event) {
  if (!widgetDragState) return;
  const { widget, offsetX, offsetY, bounds } = widgetDragState;
  const nextX = event.clientX - bounds.left - offsetX;
  const nextY = event.clientY - bounds.top - offsetY;
  widget.x = nextX;
  widget.y = nextY;
  clampWidgetToStage(widget);
}

function onWidgetDragEnd() {
  if (!widgetDragState) return;
  widgetDragState.widget.dragging = false;
  widgetDragState = null;
  window.removeEventListener("pointermove", onWidgetDragMove);
  window.removeEventListener("pointerup", onWidgetDragEnd);
}

function onWidgetResizeStart(widget, event) {
  if (event.button !== 0) return;
  event.preventDefault();
  const bounds = getWidgetBounds();
  widget.resizing = true;
  activeWidgetId.value = widget.id;
  widgetResizeState = {
    widget,
    startX: event.clientX,
    startY: event.clientY,
    startW: widget.width,
    startH: widget.height,
    aspect: widget.type === "stopwatch" ? null : getWidgetAspect(widget),
    bounds,
  };
  window.addEventListener("pointermove", onWidgetResizeMove);
  window.addEventListener("pointerup", onWidgetResizeEnd);
}

function onWidgetResizeMove(event) {
  if (!widgetResizeState) return;
  const { widget, startX, startY, startW, startH, aspect, bounds } =
    widgetResizeState;
  const minW = widget.minWidth || WIDGET_MIN_WIDTH;
  const minH = widget.minHeight || WIDGET_MIN_HEIGHT;
  const dx = event.clientX - startX;
  const dy = event.clientY - startY;
  let nextW = startW + dx;
  let nextH = startH + dy;
  if (aspect) {
    const useWidth = Math.abs(dx) >= Math.abs(dy);
    nextW = useWidth ? startW + dx : (startH + dy) * aspect;
    nextH = nextW / aspect;
  }

  if (nextW < minW) {
    nextW = minW;
    if (aspect) nextH = nextW / aspect;
  }
  if (nextH < minH) {
    nextH = minH;
    if (aspect) nextW = nextH * aspect;
  }

  if (bounds.width && bounds.height) {
    const maxW = Math.max(40, bounds.width - widget.x);
    const maxH = Math.max(40, bounds.height - widget.y);
    if (nextW > maxW) {
      nextW = maxW;
      if (aspect) nextH = nextW / aspect;
    }
    if (nextH > maxH) {
      nextH = maxH;
      if (aspect) nextW = nextH * aspect;
    }
  }

  widget.width = nextW;
  widget.height = nextH;
}

function onWidgetResizeEnd() {
  if (!widgetResizeState) return;
  widgetResizeState.widget.resizing = false;
  widgetResizeState = null;
  window.removeEventListener("pointermove", onWidgetResizeMove);
  window.removeEventListener("pointerup", onWidgetResizeEnd);
}

function triggerTemplateUpload() {
  if (!templateInput.value) return;
  templateInput.value.value = "";
  templateInput.value.click();
}

async function handleTemplateUpload(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const dataUrl = await blobToDataURL(file);
    const label = file.name.replace(/\.[^/.]+$/, "");
    const id = `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const preview = await createImagePreview(dataUrl);
    const size = await getImageSize(dataUrl);
    templates.value.push({
      id,
      label,
      color: "#111111",
      pattern: "image",
      image: dataUrl,
      preview,
      size,
      bitmap: null,
      uploaded: true,
    });
  }
  saveStoredTemplates();
}

function createImagePreview(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const cssWidth = 140;
      const cssHeight = 90;
      const scale = Math.min(2, window.devicePixelRatio || 1);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(cssWidth * scale);
      canvas.height = Math.round(cssHeight * scale);
      const ctx = canvas.getContext("2d");
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.fillStyle = "#111111";
      ctx.fillRect(0, 0, cssWidth, cssHeight);
      const fit = Math.min(cssWidth / img.width, cssHeight / img.height);
      const w = img.width * fit;
      const h = img.height * fit;
      ctx.drawImage(img, (cssWidth - w) / 2, (cssHeight - h) / 2, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

function getImageSize(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function applyTemplate(template) {
  const slide = getActiveSlide();
  if (!slide) return;
  const patternPayload = getPatternPayload(template);
  const before = {
    color: slide.backgroundColor,
    image: slide.backgroundImage,
    size: slide.backgroundSize,
    pattern: slide.backgroundPattern,
    bitmap: slide.backgroundBitmap,
  };
  applyTemplateToSlide(slide, {
    color: template.color || "#111111",
    image: template.image || null,
    size: template.size || null,
    pattern: patternPayload,
    bitmap: template.bitmap || null,
  });
  pushCommand(slide, {
    type: "background",
    before,
    after: {
      ...before,
      color: slide.backgroundColor,
      image: slide.backgroundImage,
      size: slide.backgroundSize,
      pattern: slide.backgroundPattern,
      bitmap: slide.backgroundBitmap,
    },
  });
  currentTemplate.value = {
    color: slide.backgroundColor,
    image: slide.backgroundImage,
    size: slide.backgroundSize,
    pattern: slide.backgroundPattern,
    bitmap: null,
  };
  showTemplatePopover.value = false;
  redrawAll();
}

function applyTemplateToSlide(slide, payload) {
  slide.backgroundColor = payload.color || "#111111";
  slide.backgroundImage = payload.image || null;
  slide.backgroundSize = payload.size || null;
  slide.backgroundPattern = payload.pattern || null;
  slide.backgroundBitmap = payload.bitmap || null;
}

function getPatternPayload(template) {
  if (!template?.pattern || template.pattern === "none") return null;
  if (template.pattern === "image") return null;
  return {
    pattern: template.pattern,
    color: template.color,
    step: template.step,
    line: template.line,
    lineMajor: template.lineMajor,
    dot: template.dot,
    radius: template.radius,
    margin: template.margin,
    header: template.header,
    group: template.group,
  };
}

function onDragStart(event, index) {
  draggedSlideIndex.value = index;
  if (event?.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }
}

function onDragOver(index) {
  if (draggedSlideIndex.value === null || draggedSlideIndex.value === index)
    return;
}

function onDrop(index) {
  if (draggedSlideIndex.value === null || draggedSlideIndex.value === index)
    return;
  const from = draggedSlideIndex.value;
  const to = index;
  const list = slides.value.slice();
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  slides.value = list;
  currentSlideIndex.value = to;
  draggedSlideIndex.value = null;
  renderAllThumbnails();
  markDirty();
}

function deleteSlide(index) {
  if (slides.value.length === 1) return;
  slides.value.splice(index, 1);
  if (currentSlideIndex.value >= slides.value.length) {
    currentSlideIndex.value = slides.value.length - 1;
  }
  redrawAll();
  markDirty();
}

function clearCurrentSlide() {
  const slide = getActiveSlide();
  if (!slide) return;
  slide.strokes = [];
  slide.history = [];
  slide.redoHistory = [];
  redrawAll();
  markDirty();
}

function toggleShapePopover() {
  showShapePopover.value = !showShapePopover.value;
  if (showShapePopover.value) {
    showColorPopover.value = false;
    showPenPopover.value = false;
    showEraserPopover.value = false;
    shapeTab.value = "shapes";
  }
  setTool("shape");
}

function updateShapePopoverSize() {
  nextTick(() => {
    const rect = shapePopoverRef.value?.getBoundingClientRect();
    if (!rect) return;
    shapePopoverSize.value = { width: rect.width, height: rect.height };
  });
}

function setShape(nextShape) {
  shapeType.value = nextShape;
  setTool("shape");
  if (nextShape !== "icon") {
    showShapePopover.value = false;
  }
}

function setShapeIcon(iconId) {
  activeIcon.value = iconId;
  shapeType.value = "icon";
  setTool("shape");
  showShapePopover.value = false;
}

function handleIconSelect(iconName) {
  activeIcon.value = iconName;
  shapeType.value = "icon";
  setTool("shape");
  showShapePopover.value = false;
}

function addIconToCanvas(iconName) {
  const slide = getActiveSlide();
  const centerX = (boardStage.value?.offsetWidth || 800) / 2 - 20;
  const centerY = (boardStage.value?.offsetHeight || 600) / 2 - 20;

  const iconShape = {
    id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: STROKE_TYPES.ICON,
    icon: iconName,
    x: centerX,
    y: centerY,
    width: 40,
    height: 40,
    rotation: 0,
    color: color.value,
    fillColor: color.value,
    strokeColor: null,
    alpha: 1,
    size: 40,
  };

  if (!slide.strokes) {
    slide.strokes = [];
  }
  slide.strokes.push(iconShape);
  ensureHistory(slide);
  slide.redoHistory = [];
  requestCanvasRender();
}

function clearSelection() {
  state.selectionIds = [];
  state.selectionRect = null;
  state.transform = null;
  // selectionBounds will automatically become null via computed property
  requestOverlay();
}

function beginSelectionRect(mode, point) {
  state.selectionRect = {
    mode,
    x0: point.x,
    y0: point.y,
    x1: point.x,
    y1: point.y,
  };
  requestOverlay();
}

function finalizeSelectionRect() {
  if (!state.selectionRect) return;
  const rect = normalizeRect(
    state.selectionRect.x0,
    state.selectionRect.y0,
    state.selectionRect.x1,
    state.selectionRect.y1,
  );
  const slide = getActiveSlide();
  if (!slide) return;
  if (state.selectionRect.mode === SELECTION_MODES.SELECT) {
    const ids = slide.strokes
      .filter(
        (stroke) =>
          stroke.tool !== "eraser" &&
          rectsIntersect(rect, toRect(getStrokeBounds(stroke))),
      )
      .map((stroke) => stroke.id);
    state.selectionIds = ids;
    updateSelectionBounds();
  } else if (state.selectionRect.mode === SELECTION_MODES.ERASE) {
    const removeItems = [];
    slide.strokes.forEach((stroke, index) => {
      if (stroke.tool === "eraser") return;
      if (rectsIntersect(rect, toRect(getStrokeBounds(stroke)))) {
        removeItems.push({ stroke, index });
      }
    });
    if (removeItems.length) {
      pushCommand(slide, { type: "remove", items: removeItems });
      removeItems.forEach((item) => removeStrokeById(slide, item.stroke.id));
    }
    clearSelection();
  }
  state.selectionRect = null;
  redrawAll();
}

function toRect(bbox) {
  return {
    x: bbox.minX,
    y: bbox.minY,
    w: bbox.maxX - bbox.minX,
    h: bbox.maxY - bbox.minY,
    right: bbox.maxX,
    bottom: bbox.maxY,
  };
}

function startTransform(mode, point, handle = null) {
  const slide = getActiveSlide();
  if (!slide) return;
  const base = new Map();
  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    if (stroke) base.set(id, getStrokeSnapshot(stroke));
  });
  const bounds = computedSelectionBounds.value
    ? { ...computedSelectionBounds.value }
    : null;
  state.transform = {
    mode,
    startX: point.x,
    startY: point.y,
    base,
    bounds,
    handle,
  };
  if (mode === TRANSFORM_MODES.ROTATE && bounds) {
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    state.transform.centerX = cx;
    state.transform.centerY = cy;
    state.transform.startAngle = Math.atan2(point.y - cy, point.x - cx);
  }
}

function applyMoveTransform(dx, dy) {
  const slide = getActiveSlide();
  if (!slide || !state.transform) return;
  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    const snapshot = state.transform.base.get(id);
    if (!stroke || !snapshot) return;
    if (stroke.type === STROKE_TYPES.ICON) {
      stroke.x = snapshot.x + dx;
      stroke.y = snapshot.y + dy;
      stroke.bbox = getStrokeBounds(stroke);
    } else if (stroke.type === STROKE_TYPES.SHAPE) {
      stroke.x = snapshot.x + dx;
      stroke.y = snapshot.y + dy;
      if (stroke.shape === SHAPE_TYPES.LINE) {
        stroke.x2 = snapshot.x2 + dx;
        stroke.y2 = snapshot.y2 + dy;
      }
      stroke.bbox = getShapeBounds(stroke);
    } else {
      stroke.points = snapshot.points.map((val, idx) =>
        idx % 2 === 0 ? val + dx : val + dy,
      );
      stroke.bbox = computeBoundsFromPoints(stroke.points);
    }
  });
  updateSelectionBounds();
  redrawAll();
  requestOverlay();
}

function applyScaleTransform(dx, dy, point) {
  const slide = getActiveSlide();
  if (!slide || !state.transform || !state.transform.bounds) return;
  const { bounds, handle } = state.transform;
  let scaleX = bounds.w ? 1 + dx / bounds.w : 1;
  let scaleY = bounds.h ? 1 + dy / bounds.h : 1;
  let originX = bounds.x + bounds.w / 2;
  let originY = bounds.y + bounds.h / 2;

  if (handle && point) {
    const anchor = getHandleAnchor(bounds, handle);
    const nextW = Math.max(12, Math.abs(anchor.x - point.x));
    const nextH = Math.max(12, Math.abs(anchor.y - point.y));
    scaleX = bounds.w ? nextW / bounds.w : 1;
    scaleY = bounds.h ? nextH / bounds.h : 1;
    originX = anchor.x;
    originY = anchor.y;
  }

  scaleX = Math.max(0.05, scaleX);
  scaleY = Math.max(0.05, scaleY);

  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    const snapshot = state.transform.base.get(id);
    if (!stroke || !snapshot) return;
    if (stroke.type === STROKE_TYPES.ICON) {
      // Maintain aspect ratio for icons - use uniform scale
      const uniformScale = Math.max(scaleX, scaleY);
      stroke.x = originX + (snapshot.x - originX) * scaleX;
      stroke.y = originY + (snapshot.y - originY) * scaleY;
      stroke.width = Math.max(12, snapshot.width * uniformScale);
      stroke.height = Math.max(12, snapshot.height * uniformScale);
      stroke.bbox = getStrokeBounds(stroke);
    } else if (stroke.type === STROKE_TYPES.SHAPE) {
      if (stroke.shape === SHAPE_TYPES.LINE) {
        stroke.x = originX + (snapshot.x - originX) * scaleX;
        stroke.y = originY + (snapshot.y - originY) * scaleY;
        stroke.x2 = originX + (snapshot.x2 - originX) * scaleX;
        stroke.y2 = originY + (snapshot.y2 - originY) * scaleY;
      } else {
        stroke.x = originX + (snapshot.x - originX) * scaleX;
        stroke.y = originY + (snapshot.y - originY) * scaleY;
        stroke.w = snapshot.w * scaleX;
        stroke.h = snapshot.h * scaleY;
      }
      stroke.bbox = getShapeBounds(stroke);
    } else {
      const pts = snapshot.points;
      const newPoints = [];
      for (let i = 0; i < pts.length; i += 2) {
        const x = originX + (pts[i] - originX) * scaleX;
        const y = originY + (pts[i + 1] - originY) * scaleY;
        newPoints.push(x, y);
      }
      stroke.points = newPoints;
      stroke.bbox = computeBoundsFromPoints(newPoints);
    }
  });
  updateSelectionBounds();
  redrawAll();
  requestOverlay();
}

function applyRotateTransform(point) {
  const slide = getActiveSlide();
  if (!slide || !state.transform || !state.transform.bounds) return;
  const { centerX, centerY, startAngle } = state.transform;
  if (centerX == null || centerY == null || startAngle == null) return;
  const angle = Math.atan2(point.y - centerY, point.x - centerX);
  const delta = ((angle - startAngle) * 180) / Math.PI;
  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    const snapshot = state.transform.base.get(id);
    if (!stroke || !snapshot) return;
    if (stroke.type === STROKE_TYPES.ICON) {
      stroke.rotation = (snapshot.rotation || 0) + delta;
    }
  });
  redrawAll();
  requestOverlay();
}

function finalizeTransform() {
  const slide = getActiveSlide();
  if (!slide || !state.transform) return;
  const items = [];
  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    const before = state.transform.base.get(id);
    if (!stroke || !before) return;
    const after = getStrokeSnapshot(stroke);
    items.push({ id, before, after });
  });
  if (items.length) {
    pushCommand(slide, { type: "transform", items });
  }
  state.transform = null;
}

function cloneSelection() {
  const slide = getActiveSlide();
  if (!slide || !state.selectionIds.length) return;
  const newIds = [];
  const items = [];
  state.selectionIds.forEach((id) => {
    const stroke = findStrokeById(slide, id);
    if (!stroke) return;
    const clone = JSON.parse(JSON.stringify(stroke));
    clone.id = `clone-${Math.random().toString(16).slice(2)}`;
    if (clone.type === "shape") {
      clone.x += 20;
      clone.y += 20;
      if (clone.shape === "line") {
        clone.x2 += 20;
        clone.y2 += 20;
      }
      clone.bbox = getShapeBounds(clone);
    } else if (clone.points) {
      clone.points = clone.points.map((val, idx) =>
        idx % 2 === 0 ? val + 20 : val + 20,
      );
      clone.bbox = computeBoundsFromPoints(clone.points);
    }
    slide.strokes.push(clone);
    items.push({ stroke: clone, index: slide.strokes.length - 1 });
    newIds.push(clone.id);
  });
  if (items.length) {
    pushCommand(slide, { type: "add", items });
    state.selectionIds = newIds;
    updateSelectionBounds();
    redrawAll();
  }
}

function applyIconStyleToSelection(changes) {
  const slide = getActiveSlide();
  if (!slide || !selectionHasIcons.value) return;
  const items = [];
  selectedIconStrokes.value.forEach((stroke) => {
    const before = {
      fillColor: stroke.fillColor ?? stroke.color ?? "#111111",
      strokeColor: stroke.strokeColor ?? null,
    };
    const after = {
      fillColor: before.fillColor,
      strokeColor: before.strokeColor,
      ...changes,
    };
    stroke.fillColor = after.fillColor;
    stroke.strokeColor = after.strokeColor;
    stroke.color = after.fillColor || stroke.color;
    items.push({ id: stroke.id, before, after });
  });
  if (items.length) {
    pushCommand(slide, { type: "icon-style", items });
    redrawAll();
    requestOverlay();
  }
}

function handleIconFillChange(value) {
  applyIconStyleToSelection({ fillColor: value });
}

function handleIconStrokeChange(value) {
  applyIconStyleToSelection({ strokeColor: value });
}

function hitTestShape(stroke, point) {
  if (stroke.shape === "line") {
    const dx = stroke.x2 - stroke.x;
    const dy = stroke.y2 - stroke.y;
    const lengthSq = dx * dx + dy * dy;
    if (!lengthSq) return false;
    const t =
      ((point.x - stroke.x) * dx + (point.y - stroke.y) * dy) / lengthSq;
    const clamped = Math.max(0, Math.min(1, t));
    const px = stroke.x + clamped * dx;
    const py = stroke.y + clamped * dy;
    const dist = Math.hypot(point.x - px, point.y - py);
    return dist <= stroke.size * 2;
  }
  if (stroke.shape === SHAPE_TYPES.ELLIPSE) {
    const cx = stroke.x + stroke.w / 2;
    const cy = stroke.y + stroke.h / 2;
    const rx = Math.abs(stroke.w / 2) || 1;
    const ry = Math.abs(stroke.h / 2) || 1;
    const nx = (point.x - cx) / rx;
    const ny = (point.y - cy) / ry;
    return nx * nx + ny * ny <= 1;
  }
  const rect = normalizeRect(
    stroke.x,
    stroke.y,
    stroke.x + stroke.w,
    stroke.y + stroke.h,
  );
  return pointInRect(point, rect);
}

function hitTestIcon(stroke, point) {
  // Check if point is within icon bounds
  const rect = {
    x: stroke.x,
    y: stroke.y,
    right: stroke.x + stroke.width,
    bottom: stroke.y + stroke.height,
  };
  return pointInRect(point, rect);
}

function hitTestStrokePath(stroke, point, radius) {
  if (!stroke.points || stroke.points.length < 2) return false;
  const r = radius + (stroke.size || 1) * 0.5;
  const pts = stroke.points;
  for (let i = 0; i < pts.length - 2; i += 2) {
    const x1 = pts[i];
    const y1 = pts[i + 1];
    const x2 = pts[i + 2];
    const y2 = pts[i + 3];
    if (pointToSegmentDistance(point.x, point.y, x1, y1, x2, y2) <= r) {
      return true;
    }
  }
  return false;
}

function pointToSegmentDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1);
  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
  const clamped = Math.max(0, Math.min(1, t));
  const cx = x1 + clamped * dx;
  const cy = y1 + clamped * dy;
  return Math.hypot(px - cx, py - cy);
}

function startElementErase(point) {
  const slide = getActiveSlide();
  if (!slide) return;
  state.eraseIndexMap = new Map(
    slide.strokes.map((stroke, index) => [stroke.id, index]),
  );
  state.erasedItems = [];
  state.erasedIds = new Set();
  eraseAtPoint(point);
}

function eraseAtPoint(point) {
  const slide = getActiveSlide();
  if (!slide) return;
  const radius = size.value || TOOL_DEFAULTS.eraser.size;
  let removed = false;
  for (let i = slide.strokes.length - 1; i >= 0; i -= 1) {
    const stroke = slide.strokes[i];
    if (!stroke || stroke.tool === "eraser") continue;
    if (state.erasedIds?.has(stroke.id)) continue;
    const bbox = getStrokeBounds(stroke);
    const padding = radius + (stroke.size || 1);
    if (
      point.x < bbox.minX - padding ||
      point.x > bbox.maxX + padding ||
      point.y < bbox.minY - padding ||
      point.y > bbox.maxY + padding
    ) {
      continue;
    }
    const hit =
      stroke.type === STROKE_TYPES.SHAPE
        ? hitTestShape(stroke, point)
        : stroke.type === STROKE_TYPES.ICON
          ? hitTestIcon(stroke, point)
          : hitTestStrokePath(stroke, point, radius);
    if (!hit) continue;
    const index =
      (state.eraseIndexMap?.get(stroke.id) ?? Number.isFinite(i)) ? i : 0;
    state.erasedItems.push({ stroke, index });
    state.erasedIds?.add(stroke.id);
    slide.strokes.splice(i, 1);
    removed = true;
  }
  if (removed) {
    redrawAll();
  }
}

function finalizeElementErase() {
  const slide = getActiveSlide();
  if (!slide) return;
  if (state.erasedItems && state.erasedItems.length) {
    pushCommand(slide, { type: "remove", items: state.erasedItems });
  }
  state.eraseIndexMap = null;
  state.erasedItems = [];
  state.erasedIds = null;
  redrawAll();
}

function handleFill(point) {
  const slide = getActiveSlide();
  if (!slide) return;
  for (let i = slide.strokes.length - 1; i >= 0; i -= 1) {
    const stroke = slide.strokes[i];
    if (
      stroke.type === STROKE_TYPES.SHAPE &&
      hitTestShape(stroke, point) &&
      stroke.shape !== SHAPE_TYPES.LINE
    ) {
      const before = stroke.fillColor || null;
      const after = color.value;
      stroke.fillColor = after;
      pushCommand(slide, { type: "fill-shape", id: stroke.id, before, after });
      redrawAll();
      return;
    }
  }
  const before = {
    color: slide.backgroundColor || "#111111",
    image: slide.backgroundImage,
    size: slide.backgroundSize,
    pattern: slide.backgroundPattern,
    bitmap: slide.backgroundBitmap,
  };
  const after = {
    color: color.value,
    image: null,
    size: null,
    pattern: null,
    bitmap: null,
  };
  slide.backgroundColor = after.color;
  slide.backgroundImage = null;
  slide.backgroundSize = null;
  slide.backgroundPattern = null;
  slide.backgroundBitmap = null;
  pushCommand(slide, { type: "background", before, after });
  redrawAll();
}

function commitShape(start, end) {
  const slide = getActiveSlide();
  if (!slide) return;
  const rect = normalizeRect(start.x, start.y, end.x, end.y);
  const base = TOOL_DEFAULTS.shape;

  if (shapeType.value === "icon") {
    const stroke = {
      id: `icon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: STROKE_TYPES.ICON,
      icon: activeIcon.value,
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
      rotation: 0,
      color: color.value,
      fillColor: color.value,
      strokeColor: null,
      alpha: base.alpha,
      size: rect.w,
    };
    slide.strokes.push(stroke);
    pushCommand(slide, {
      type: "add",
      items: [{ stroke, index: slide.strokes.length - 1 }],
    });
    state.selectionIds = [stroke.id];
    updateSelectionBounds();
    redrawAll();
    return;
  }

  const stroke = {
    id: `shape-${strokeCounter.value++}`,
    type: "shape",
    tool: "shape",
    shape: shapeType.value,
    color: color.value,
    size: size.value || base.size,
    alpha: base.alpha,
    fillColor: null,
  };
  if (shapeType.value === "line") {
    stroke.x = start.x;
    stroke.y = start.y;
    stroke.x2 = end.x;
    stroke.y2 = end.y;
  } else {
    stroke.x = rect.x;
    stroke.y = rect.y;
    stroke.w = rect.w;
    stroke.h = rect.h;
  }
  stroke.bbox = getShapeBounds(stroke);
  slide.strokes.push(stroke);
  pushCommand(slide, {
    type: "add",
    items: [{ stroke, index: slide.strokes.length - 1 }],
  });
  redrawAll();
}

function getCanvasSize() {
  if (!inkCanvas.value) return { width: 1, height: 1 };

  return {
    width: inkCanvas.value.width,
    height: inkCanvas.value.height,
  };
}

function triggerImport() {
  if (!importInput.value) return;
  importInput.value.value = "";
  importInput.value.click();
}

function triggerPdfImport() {
  if (!pdfInput.value) return;
  pdfInput.value.value = "";
  pdfInput.value.click();
}

function sanitizeSlide(raw, scaleX, scaleY) {
  const strokes = Array.isArray(raw.strokes) ? raw.strokes : [];
  return {
    id: raw.id || `slide-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    strokes: strokes.map((stroke) => {
      if (stroke.type === STROKE_TYPES.SHAPE) {
        const s = {
          id: stroke.id || `shape-${Math.random().toString(16).slice(2)}`,
          type: STROKE_TYPES.SHAPE,
          tool: "shape",
          shape: stroke.shape || "rect",
          color: stroke.color || "#ffffff",
          size: typeof stroke.size === "number" ? stroke.size : 3,
          alpha: typeof stroke.alpha === "number" ? stroke.alpha : 1,
          fillColor: stroke.fillColor || null,
        };
        if (s.shape === "line") {
          s.x = (stroke.x || 0) * scaleX;
          s.y = (stroke.y || 0) * scaleY;
          s.x2 = (stroke.x2 || 0) * scaleX;
          s.y2 = (stroke.y2 || 0) * scaleY;
        } else {
          s.x = (stroke.x || 0) * scaleX;
          s.y = (stroke.y || 0) * scaleY;
          s.w = (stroke.w || 0) * scaleX;
          s.h = (stroke.h || 0) * scaleY;
        }
        s.bbox = getShapeBounds(s);
        return s;
      }
      const points = Array.isArray(stroke.points)
        ? stroke.points.map((val, idx) =>
            idx % 2 === 0 ? val * scaleX : val * scaleY,
          )
        : [];
      return {
        id: stroke.id || `stroke-${Math.random().toString(16).slice(2)}`,
        type: "path",
        tool: stroke.tool || "pen",
        color: stroke.color || "#ffffff",
        size: typeof stroke.size === "number" ? stroke.size : 3.5,
        alpha: typeof stroke.alpha === "number" ? stroke.alpha : 1,
        composite: stroke.composite || "source-over",
        points,
        bbox: points.length ? computeBoundsFromPoints(points) : null,
      };
    }),
    thumb: "",
    backgroundColor: raw.backgroundColor || "#111111",
    backgroundImage: raw.backgroundImage || null,
    backgroundSize: raw.backgroundSize || null,
    backgroundBitmap: null,
    history: [],
    redoHistory: [],
  };
}

function handleImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!applyDeckPayload(payload)) return;
      markDirty();
    } catch (err) {
      console.error("Failed to import drawing", err);
    }
  };
  reader.readAsText(file);
}

async function handlePdfImport(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  pdfImportAbort = false;
  pdfRenderTask = null;
  try {
    pdfImportStatus.value = {
      active: true,
      message: "Loading PDF...",
      current: 0,
      total: 0,
      error: false,
      cancelled: false,
    };
    const { pdfjsLib, pdfWorkerUrl } = await loadPdfJs();
    pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const data = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const { width: canvasW, height: canvasH } = getCanvasSize();
    const newSlides = [];
    pdfImportStatus.value = {
      ...pdfImportStatus.value,
      total: pdf.numPages,
      message: `Rendering 1 / ${pdf.numPages}`,
    };
    for (let i = 1; i <= pdf.numPages; i += 1) {
      if (pdfImportAbort) {
        pdfImportStatus.value = {
          ...pdfImportStatus.value,
          message: "Import canceled",
          cancelled: true,
        };
        return;
      }
      pdfImportStatus.value = {
        ...pdfImportStatus.value,
        current: i,
        message: `Rendering ${i} / ${pdf.numPages}`,
      };
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1 });
      const scale = Math.min(
        canvasW / viewport.width,
        canvasH / viewport.height,
      );
      let renderScale = scale * PDF_RENDER_SCALE;
      const maxDim = Math.max(viewport.width, viewport.height);
      const maxAllowedScale = PDF_RENDER_MAX_DIM / maxDim;
      if (renderScale > maxAllowedScale) {
        renderScale = maxAllowedScale;
      }
      const renderViewport = page.getViewport({ scale: renderScale });
      const renderWidth = Math.ceil(renderViewport.width);
      const renderHeight = Math.ceil(renderViewport.height);
      const canvas =
        typeof OffscreenCanvas !== "undefined"
          ? new OffscreenCanvas(renderWidth, renderHeight)
          : document.createElement("canvas");
      canvas.width = renderWidth;
      canvas.height = renderHeight;
      const ctx = canvas.getContext("2d");
      pdfRenderTask = page.render({
        canvasContext: ctx,
        viewport: renderViewport,
      });
      try {
        await pdfRenderTask.promise;
      } finally {
        pdfRenderTask = null;
      }
      if (pdfImportAbort) {
        pdfImportStatus.value = {
          ...pdfImportStatus.value,
          message: "Import canceled",
          cancelled: true,
        };
        return;
      }
      const slide = createSlide();
      slide.backgroundPattern = null;
      if (typeof createImageBitmap !== "undefined") {
        slide.backgroundBitmap = await createImageBitmap(canvas);
        if (canvas.convertToBlob) {
          const blob = await canvas.convertToBlob();
          slide.backgroundImage = await blobToDataURL(blob);
        } else if (canvas.toDataURL) {
          slide.backgroundImage = canvas.toDataURL("image/png");
        }
      } else if (canvas.convertToBlob) {
        const blob = await canvas.convertToBlob();
        slide.backgroundImage = await blobToDataURL(blob);
      } else if (canvas.toDataURL) {
        slide.backgroundImage = canvas.toDataURL("image/png");
      }
      slide.backgroundSize = {
        width: renderViewport.width,
        height: renderViewport.height,
      };
      newSlides.push(slide);
    }
    if (pdfImportAbort) {
      pdfImportStatus.value = {
        ...pdfImportStatus.value,
        message: "Import canceled",
        cancelled: true,
      };
      return;
    }
    slides.value = newSlides;
    currentSlideIndex.value = 0;
    renderAllThumbnails();
    redrawAll();
    markDirty();
    pdfImportStatus.value = {
      ...pdfImportStatus.value,
      message: "Import complete",
    };
    setTimeout(() => {
      pdfImportStatus.value = {
        active: false,
        message: "",
        current: 0,
        total: 0,
        error: false,
        cancelled: false,
      };
    }, 700);
  } catch (err) {
    if (pdfImportAbort) {
      pdfImportStatus.value = {
        ...pdfImportStatus.value,
        message: "Import canceled",
        cancelled: true,
      };
      return;
    }
    console.error("Failed to import PDF", err);
    pdfImportStatus.value = {
      active: true,
      message: "PDF import failed",
      current: 0,
      total: 0,
      error: true,
      cancelled: false,
    };
    setTimeout(() => {
      pdfImportStatus.value = {
        active: false,
        message: "",
        current: 0,
        total: 0,
        error: false,
        cancelled: false,
      };
    }, 1500);
  }
}

function cancelPdfImport() {
  if (!pdfImportStatus.value.active) return;
  pdfImportAbort = true;
  if (pdfRenderTask?.cancel) {
    try {
      pdfRenderTask.cancel();
    } catch (err) {
      console.warn("Failed to cancel PDF render task", err);
    }
  }
  pdfImportStatus.value = {
    ...pdfImportStatus.value,
    message: "Canceling...",
    cancelled: true,
  };
}

function exportJson() {
  const payload = serializeDeck();
  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "teaching-board.json";
  link.click();
  URL.revokeObjectURL(url);
}

function exportPng() {
  const dataUrl = inkCanvas.value.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `slide-${currentSlideIndex.value + 1}.png`;
  link.click();
}

async function exportPdf() {
  const { jsPDF } = await loadJsPdf();
  const { width, height } = getCanvasSize();
  const doc = new jsPDF({ unit: "px", format: [width, height] });
  for (let i = 0; i < slides.value.length; i += 1) {
    const slide = slides.value[i];
    if (i > 0) doc.addPage([width, height]);
    await ensureBackgroundReady(slide);
    const canvas = renderSlideToCanvas(slide, 2);
    const dataUrl = canvas.toDataURL("image/png");
    doc.addImage(dataUrl, "PNG", 0, 0, width, height);
  }
  doc.save("teaching-board.pdf");
}

function renderSlideToCanvas(slide, scale) {
  const { width, height } = getCanvasSize();
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  ctx.scale(scale, scale);
  drawBackground(ctx, slide, width, height);
  for (const stroke of slide.strokes) {
    renderStroke(ctx, stroke);
  }
  return canvas;
}

async function ensureBackgroundReady(slide) {
  if (slide.backgroundBitmap) return;
  if (!slide.backgroundImage) return;
  const img = getBackgroundImage(slide.backgroundImage);
  if (!img) return;
  if (!img.complete || !img.naturalWidth) {
    await new Promise((resolve) => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    });
  }
  if (typeof createImageBitmap !== "undefined" && img.naturalWidth) {
    try {
      slide.backgroundBitmap = await createImageBitmap(img);
    } catch (err) {
      console.warn("Failed to create ImageBitmap", err);
    }
  }
}

function blobToDataURL(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

function handlePointerDown(e) {
  const point = getPointFromEvent(e);
  state.pendingPoints = [];

  // Handle selection tools (pointer and select) using SelectorTool
  if (SelectorTool.isSelectionTool(tool.value)) {
    state.isDrawing = true;
    inkCanvas.value.setPointerCapture(e.pointerId);

    if (selectionHasIcons.value && getRotationHandleAt(point)) {
      startTransform(TRANSFORM_MODES.ROTATE, point, "rotate");
      return;
    }

    // Check if point is within existing selection
    if (SelectorTool.canSelectAt(point, computedSelectionBounds.value)) {
      const handle = SelectorTool.getHandleAt(point, getSelectionHandleAt);
      if (handle) {
        startTransform(TRANSFORM_MODES.SCALE, point, handle);
        return;
      }
      startTransform(
        e.altKey ? TRANSFORM_MODES.SCALE : TRANSFORM_MODES.MOVE,
        point,
      );
      return;
    }

    clearSelection();

    // Check if clicking directly on a stroke (single-click selection)
    const slide = getActiveSlide();
    if (slide) {
      // Check strokes from top to bottom (reverse order - last drawn is on top)
      for (let i = slide.strokes.length - 1; i >= 0; i--) {
        const stroke = slide.strokes[i];
        if (stroke.tool === "eraser") continue;

        const hit =
          stroke.type === STROKE_TYPES.SHAPE
            ? hitTestShape(stroke, point)
            : stroke.type === STROKE_TYPES.ICON
              ? hitTestIcon(stroke, point)
              : hitTestStrokePath(stroke, point, 8);

        if (hit) {
          // Found a stroke - select it and prepare to move
          state.selectionIds = [stroke.id];
          updateSelectionBounds();
          startTransform(TRANSFORM_MODES.MOVE, point);
          requestOverlay();
          return;
        }
      }
    }

    // No stroke hit - start drag selection
    state.selectionRect = SelectorTool.beginSelection(
      point,
      SELECTION_MODES.SELECT,
    );
    requestOverlay();
    return;
  }

  if (tool.value === "fill") {
    handleFill(point);
    return;
  }

  if (tool.value === "eraser" && eraserMode.value === "area") {
    state.isDrawing = true;
    inkCanvas.value.setPointerCapture(e.pointerId);
    startElementErase(point);
    return;
  }

  if (tool.value === "shape") {
    state.isDrawing = true;
    inkCanvas.value.setPointerCapture(e.pointerId);
    state.shapePreview = { start: point, end: point };
    requestOverlay();
    return;
  }

  state.isDrawing = true;
  inkCanvas.value.setPointerCapture(e.pointerId);
  if (tool.value === "laser") {
    addLaserPoint(point);
    return;
  }
  currentStroke = startStroke(point);
  state.pendingPoints.push(point.x, point.y);
  scheduleFlush();
}

function handlePointerMove(e) {
  const point = getPointFromEvent(e);
  state.cursor.x = point.x;
  state.cursor.y = point.y;
  state.cursor.active = true;
  requestOverlay();

  if (!state.isDrawing) return;

  if (tool.value === "pointer" || tool.value === "select") {
    if (state.transform) {
      const dx = point.x - state.transform.startX;
      const dy = point.y - state.transform.startY;
      if (state.transform.mode === TRANSFORM_MODES.SCALE) {
        applyScaleTransform(dx, dy, point);
      } else if (state.transform.mode === TRANSFORM_MODES.ROTATE) {
        applyRotateTransform(point);
      } else {
        applyMoveTransform(dx, dy);
      }
      requestOverlay();
      return;
    }
    if (state.selectionRect) {
      state.selectionRect.x1 = point.x;
      state.selectionRect.y1 = point.y;
      requestOverlay();
    }
    return;
  }

  if (tool.value === "eraser" && eraserMode.value === "area") {
    eraseAtPoint(point);
    return;
  }

  if (tool.value === "shape") {
    if (state.shapePreview) {
      state.shapePreview.end = point;
      requestOverlay();
    }
    return;
  }

  if (tool.value === "laser") {
    addLaserPoint(point);
    return;
  }

  state.pendingPoints.push(point.x, point.y);
  scheduleFlush();
}

function handlePointerUp(e) {
  if (!state.isDrawing) return;
  state.isDrawing = false;
  inkCanvas.value.releasePointerCapture(e.pointerId);

  if (tool.value === "select") {
    if (state.transform) {
      finalizeTransform();
    } else if (state.selectionRect) {
      finalizeSelectionRect();
    }
    return;
  }

  if (tool.value === "eraser" && eraserMode.value === "area") {
    finalizeElementErase();
    return;
  }

  if (tool.value === "shape") {
    if (state.shapePreview) {
      commitShape(state.shapePreview.start, state.shapePreview.end);
    }
    state.shapePreview = null;
    requestOverlay();
    return;
  }

  if (tool.value === "laser") {
    return;
  }

  flushStroke();
  if (currentStroke) {
    const slide = getActiveSlide();
    if (slide) {
      pushCommand(slide, {
        type: "add",
        items: [{ stroke: currentStroke, index: slide.strokes.length - 1 }],
      });
    }
  }
  currentStroke = null;
  updateThumbnail();
}

function addLaserPoint(point) {
  const now = performance.now();
  state.laserTrail.push({ x: point.x, y: point.y, t: now });
  requestOverlay();
}

function requestOverlay() {
  if (state.overlayDirty) return;
  state.overlayDirty = true;
  requestAnimationFrame(renderOverlay);
}

function renderOverlay() {
  state.overlayDirty = false;
  const rect = overlayCanvas.value.getBoundingClientRect();
  overlayCtx.value.clearRect(0, 0, rect.width, rect.height);

  if (isRecording.value) {
    overlayCtx.value.save();
    overlayCtx.value.strokeStyle = "#ff3b30";
    overlayCtx.value.lineWidth = 2;
    overlayCtx.value.setLineDash([6, 4]);
    overlayCtx.value.strokeRect(3, 3, rect.width - 6, rect.height - 6);
    overlayCtx.value.restore();
  }

  if (state.cursor.active && tool.value !== "pointer") {
    overlayCtx.value.save();
    overlayCtx.value.globalAlpha = 0.8;
    overlayCtx.value.strokeStyle =
      tool.value === "eraser" ? "#ffffff" : color.value;
    overlayCtx.value.lineWidth = 1.2;
    overlayCtx.value.beginPath();
    overlayCtx.value.arc(
      state.cursor.x,
      state.cursor.y,
      size.value,
      0,
      Math.PI * 2,
    );
    overlayCtx.value.stroke();
    overlayCtx.value.restore();
  }

  if (state.selectionRect) {
    const rectSel = normalizeRect(
      state.selectionRect.x0,
      state.selectionRect.y0,
      state.selectionRect.x1,
      state.selectionRect.y1,
    );
    overlayCtx.value.save();
    overlayCtx.value.strokeStyle =
      state.selectionRect.mode === "erase" ? "#ff6b81" : "#6c8cff";
    overlayCtx.value.lineWidth = 1;
    overlayCtx.value.setLineDash([6, 4]);
    overlayCtx.value.strokeRect(rectSel.x, rectSel.y, rectSel.w, rectSel.h);
    overlayCtx.value.restore();
  }

  if (computedSelectionBounds.value) {
    overlayCtx.value.save();
    overlayCtx.value.strokeStyle = "#6c8cff";
    overlayCtx.value.lineWidth = 1.2;
    overlayCtx.value.setLineDash([4, 4]);
    overlayCtx.value.strokeRect(
      computedSelectionBounds.value.x,
      computedSelectionBounds.value.y,
      computedSelectionBounds.value.w,
      computedSelectionBounds.value.h,
    );
    overlayCtx.value.restore();
    drawSelectionHandles(overlayCtx.value, computedSelectionBounds.value);
    if (selectionHasIcons.value) {
      drawRotationHandle(overlayCtx.value, computedSelectionBounds.value);
    }
  }

  if (state.shapePreview) {
    const start = state.shapePreview.start;
    const end = state.shapePreview.end;
    let drewIcon = false;
    overlayCtx.value.save();
    overlayCtx.value.strokeStyle = color.value;
    overlayCtx.value.lineWidth = size.value;
    overlayCtx.value.setLineDash([5, 4]);
    overlayCtx.value.beginPath();
    if (shapeType.value === "line") {
      overlayCtx.value.moveTo(start.x, start.y);
      overlayCtx.value.lineTo(end.x, end.y);
    } else if (shapeType.value === "ellipse") {
      const rectShape = normalizeRect(start.x, start.y, end.x, end.y);
      const cx = rectShape.x + rectShape.w / 2;
      const cy = rectShape.y + rectShape.h / 2;
      overlayCtx.value.ellipse(
        cx,
        cy,
        Math.abs(rectShape.w / 2),
        Math.abs(rectShape.h / 2),
        0,
        0,
        Math.PI * 2,
      );
    } else if (shapeType.value === "icon") {
      const rectShape = normalizeRect(start.x, start.y, end.x, end.y);
      const tempIcon = {
        icon: activeIcon.value,
        x: rectShape.x,
        y: rectShape.y,
        width: rectShape.w,
        height: rectShape.h,
        rotation: 0,
        fillColor: color.value,
        strokeColor: null,
        alpha: 1,
      };
      overlayCtx.value.restore();
      drawBootstrapIcon(overlayCtx.value, tempIcon);
      drewIcon = true;
    } else {
      const rectShape = normalizeRect(start.x, start.y, end.x, end.y);
      overlayCtx.value.rect(rectShape.x, rectShape.y, rectShape.w, rectShape.h);
    }
    if (!drewIcon) {
      overlayCtx.value.stroke();
      overlayCtx.value.restore();
    }
  }

  const now = performance.now();
  const life = 600;
  const trail = state.laserTrail;
  let start = state.laserStart;
  while (start < trail.length && now - trail[start].t > life) {
    start += 1;
  }
  state.laserStart = start;

  if (trail.length - start > 1) {
    overlayCtx.value.save();
    overlayCtx.value.lineCap = "round";
    overlayCtx.value.lineJoin = "round";
    overlayCtx.value.strokeStyle = color.value;
    overlayCtx.value.lineWidth = size.value;
    overlayCtx.value.globalCompositeOperation = "lighter";

    overlayCtx.value.beginPath();
    overlayCtx.value.moveTo(trail[start].x, trail[start].y);
    for (let i = start + 1; i < trail.length; i += 1) {
      const p = trail[i];
      const age = (now - p.t) / life;
      overlayCtx.value.globalAlpha = Math.max(0, 1 - age);
      overlayCtx.value.lineTo(p.x, p.y);
    }
    overlayCtx.value.stroke();
    overlayCtx.value.restore();
  }

  if (trail.length - start > 0) {
    requestOverlay();
  } else if (state.laserStart > 0) {
    state.laserTrail = [];
    state.laserStart = 0;
  }
}

function handleKeydown(e) {
  if (!isClassRoute.value) return;
  const target = e.target;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable)
  ) {
    return;
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    if (e.shiftKey) {
      redo();
    } else {
      undo();
    }
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
    e.preventDefault();
    redo();
  }
  if (!e.altKey) return;
  if (e.key.toLowerCase() === "v") setTool("select");
  if (e.key.toLowerCase() === "p") setTool("pen");
  if (e.key.toLowerCase() === "h") setTool("highlighter");
  if (e.key.toLowerCase() === "l") setTool("laser");
  if (e.key.toLowerCase() === "s") setTool("shape");
  if (e.key.toLowerCase() === "f") setTool("fill");
  if (e.key.toLowerCase() === "e") {
    setTool("eraser");
    eraserMode.value = eraserMode.value === "pixel" ? "area" : "pixel";
  }
  if (e.key.toLowerCase() === "c") cloneSelection();
}

function initTemplates() {
  const base = [
    { id: "chalk", label: "Chalk", color: "#111111", pattern: "none" },
    { id: "midnight", label: "Midnight", color: "#0b0f1a", pattern: "none" },
    { id: "white", label: "White", color: "#fefefe", pattern: "none" },
    { id: "paper", label: "Paper", color: "#f7f1e3", pattern: "none" },
    {
      id: "grid-dark",
      label: "Grid Dark",
      color: "#111111",
      pattern: "grid",
      step: 40,
    },
    {
      id: "grid-light",
      label: "Grid Light",
      color: "#ffffff",
      pattern: "grid",
      step: 40,
    },
    {
      id: "graph-light",
      label: "Graph Light",
      color: "#ffffff",
      pattern: "graph",
      step: 20,
    },
    {
      id: "graph-dark",
      label: "Graph Dark",
      color: "#0b0f1a",
      pattern: "graph",
      step: 20,
    },
    {
      id: "dots-dark",
      label: "Dots Dark",
      color: "#111111",
      pattern: "dots",
      step: 36,
    },
    {
      id: "dots-light",
      label: "Dots Light",
      color: "#ffffff",
      pattern: "dots",
      step: 36,
    },
    {
      id: "ruled",
      label: "Ruled",
      color: "#fdfcf8",
      pattern: "ruled",
      step: 32,
      margin: 96,
    },
    {
      id: "ruled-dark",
      label: "Ruled Dark",
      color: "#101417",
      pattern: "ruled",
      step: 32,
      margin: 96,
    },
    {
      id: "cornell",
      label: "Cornell",
      color: "#fdfcf8",
      pattern: "cornell",
      step: 32,
      margin: 96,
      header: 80,
    },
    {
      id: "isometric",
      label: "Isometric",
      color: "#ffffff",
      pattern: "isometric",
      step: 28,
    },
    { id: "hex", label: "Hex", color: "#ffffff", pattern: "hex", step: 20 },
    {
      id: "music",
      label: "Music",
      color: "#ffffff",
      pattern: "music",
      step: 10,
      group: 26,
    },
    {
      id: "timeline",
      label: "Timeline",
      color: "#ffffff",
      pattern: "timeline",
      step: 90,
    },
    {
      id: "blueprint",
      label: "Blueprint",
      color: "#0b1f3a",
      pattern: "grid",
      step: 40,
      line: "rgba(255,255,255,0.16)",
      lineMajor: "rgba(255,255,255,0.32)",
    },
    {
      id: "diagonal",
      label: "Diagonal",
      color: "#fdfcf8",
      pattern: "diagonal",
      step: 26,
    },
  ];
  templates.value = base.map((tpl) => {
    const preview = createTemplatePreview(tpl);
    return { ...tpl, preview, ...createTemplateBackground(tpl) };
  });
  if (Object.keys(templateAssetModules).length) {
    const assetTemplates = Object.entries(templateAssetModules)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, src], index) => {
        const filename = path.split("/").pop() || `Template ${index + 1}`;
        const label = filename.replace(/\.(png|jpe?g|webp)$/i, "");
        return {
          id: `asset-${index}`,
          label: label || `Template ${index + 1}`,
          image: src,
          preview: src,
          color: "#ffffff",
          size: { width: 1920, height: 1080 },
          uploaded: true,
        };
      });
    templates.value = [...templates.value, ...assetTemplates];
  }
  const stored = loadStoredTemplates();
  if (stored.length) {
    templates.value = [...templates.value, ...stored];
  }
}

function loadStoredTemplates() {
  try {
    const raw = localStorage.getItem("uploadedTemplates");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((tpl) => tpl && tpl.image && tpl.preview)
      .map((tpl) => ({
        ...tpl,
        uploaded: true,
      }));
  } catch (err) {
    console.warn("Failed to load templates", err);
    return [];
  }
}

function saveStoredTemplates() {
  const uploaded = templates.value.filter((tpl) => tpl.uploaded);
  const payload = uploaded.map((tpl) => ({
    id: tpl.id,
    label: tpl.label,
    color: tpl.color,
    image: tpl.image,
    preview: tpl.preview,
    size: tpl.size,
    uploaded: true,
  }));
  try {
    localStorage.setItem("uploadedTemplates", JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to save templates", err);
  }
}

function createTemplatePreview(tpl) {
  const cssWidth = 140;
  const cssHeight = 90;
  const scale = Math.min(2, window.devicePixelRatio || 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cssWidth * scale);
  canvas.height = Math.round(cssHeight * scale);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.fillStyle = tpl.color;
  ctx.fillRect(0, 0, cssWidth, cssHeight);
  drawTemplatePattern(ctx, tpl, cssWidth, cssHeight);
  return canvas.toDataURL("image/png");
}

function createTemplateBackground(tpl) {
  if (tpl.pattern === "none") {
    return { color: tpl.color, image: null, size: null, bitmap: null };
  }
  if (tpl.pattern === "image" && tpl.image) {
    return {
      color: tpl.color || "#111111",
      image: tpl.image,
      size: tpl.size || null,
      bitmap: null,
    };
  }
  return {
    color: tpl.color,
    image: null,
    size: null,
    bitmap: null,
  };
}

function drawTemplatePattern(ctx, tpl, width, height) {
  const pattern = tpl.pattern;
  const isDark = isDarkColor(tpl.color);
  const line =
    tpl.line || (isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)");
  const lineMajor =
    tpl.lineMajor || (isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)");
  const dot =
    tpl.dot || (isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.2)");
  const step = tpl.step || 40;

  if (pattern === "grid" || pattern === "graph") {
    const majorEvery = 5;
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x += step) {
      ctx.strokeStyle = x % (step * majorEvery) === 0 ? lineMajor : line;
      ctx.beginPath();
      const px = snapLine(x);
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += step) {
      ctx.strokeStyle = y % (step * majorEvery) === 0 ? lineMajor : line;
      ctx.beginPath();
      const py = snapLine(y);
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }
    return;
  }

  if (pattern === "dots") {
    ctx.fillStyle = dot;
    const radius = tpl.radius || 1.4;
    for (let x = 0; x <= width; x += step) {
      for (let y = 0; y <= height; y += step) {
        ctx.beginPath();
        ctx.arc(
          Math.round(x) + 0.5,
          Math.round(y) + 0.5,
          radius,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    return;
  }

  if (pattern === "ruled" || pattern === "cornell") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const margin = tpl.margin || 96;
    for (let y = step; y <= height; y += step) {
      ctx.beginPath();
      const py = snapLine(y);
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }
    ctx.strokeStyle = lineMajor;
    ctx.beginPath();
    const mx = snapLine(margin);
    ctx.moveTo(mx, 0);
    ctx.lineTo(mx, height);
    ctx.stroke();
    if (pattern === "cornell") {
      const header = tpl.header || 80;
      ctx.beginPath();
      const hy = snapLine(header);
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();
    }
    return;
  }

  if (pattern === "diagonal") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    for (let x = -height; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(snapLine(x), 0);
      ctx.lineTo(snapLine(x + height), height);
      ctx.stroke();
    }
    return;
  }

  if (pattern === "timeline") {
    ctx.strokeStyle = lineMajor;
    ctx.lineWidth = 2;
    const mid = height / 2;
    ctx.beginPath();
    const my = snapLine(mid);
    ctx.moveTo(0, my);
    ctx.lineTo(width, my);
    ctx.stroke();
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const tick = 12;
    for (let x = step; x <= width; x += step) {
      ctx.beginPath();
      const px = snapLine(x);
      ctx.moveTo(px, my - tick);
      ctx.lineTo(px, my + tick);
      ctx.stroke();
    }
    return;
  }

  if (pattern === "music") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const staffGap = tpl.step || 10;
    const groupGap = tpl.group || 26;
    let y = staffGap * 2;
    while (y < height) {
      for (let i = 0; i < 5; i += 1) {
        const lineY = y + i * staffGap;
        ctx.beginPath();
        const py = snapLine(lineY);
        ctx.moveTo(0, py);
        ctx.lineTo(width, py);
        ctx.stroke();
      }
      y += staffGap * 5 + groupGap;
    }
    return;
  }

  if (pattern === "isometric") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const angle = Math.PI / 3;
    const dx = height / Math.tan(angle);
    for (let y = 0; y <= height; y += step) {
      ctx.beginPath();
      const py = snapLine(y);
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }
    for (let x = -height; x <= width; x += step) {
      ctx.beginPath();
      ctx.moveTo(snapLine(x), 0);
      ctx.lineTo(snapLine(x + dx), height);
      ctx.stroke();
    }
    for (let x = 0; x <= width + height; x += step) {
      ctx.beginPath();
      ctx.moveTo(snapLine(x), 0);
      ctx.lineTo(snapLine(x - dx), height);
      ctx.stroke();
    }
    return;
  }

  if (pattern === "hex") {
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const r = tpl.step || 20;
    const h = Math.sqrt(3) * r;
    const dx = 1.5 * r;
    const dy = h;
    let row = 0;
    for (let y = 0; y <= height + h; y += dy) {
      const offset = row % 2 === 0 ? 0 : dx / 2;
      for (let x = -r; x <= width + r; x += dx) {
        drawHex(ctx, x + offset, y, r);
      }
      row += 1;
    }
  }
}

function snapLine(value) {
  return Math.round(value) + 0.5;
}

function drawHex(ctx, cx, cy, r) {
  const angle = Math.PI / 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const x = cx + r * Math.cos(angle * i);
    const y = cy + r * Math.sin(angle * i);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function isDarkColor(hex) {
  if (!hex || hex[0] !== "#" || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma < 0.45;
}

onMounted(async () => {
  slides.value = [createSlide()];
  inkCtx.value = inkCanvas.value.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  bgCtx.value = backgroundCanvas.value.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  overlayCtx.value = overlayCanvas.value.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  recordCanvas = document.createElement("canvas");
  recordCtx = recordCanvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  recordCompositeCanvas = document.createElement("canvas");
  recordCompositeCanvas.width = recordSize.width;
  recordCompositeCanvas.height = recordSize.height;
  recordCompositeCtx = recordCompositeCanvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });

  resizeCanvases();
  setTool("pen");
  initTemplates();
  updateDockMetrics();

  const loaded = await loadDeckFromDb();
  if (!loaded) {
    redrawAll();
    renderAllThumbnails();
  }
  await loadRecordings();
  await loadDevices();
  await loadRecordingDirHandle();
  loadLiveSettings();
  updateWidgetTickerState();
  const savedAudacity = localStorage.getItem("audacitySyncEnabled");
  if (savedAudacity !== null) {
    audacitySyncEnabled.value = savedAudacity === "true";
  } else {
    audacitySyncEnabled.value = !!audacityBridgeUrl;
  }
  if (audacitySyncEnabled.value) {
    startAudacityHealthTimer();
  } else {
    checkAudacityHealth();
  }

  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("popstate", handlePopstate);
  window.addEventListener("resize", handleViewportResize);
  resizeObserver = new ResizeObserver(resizeCanvases);
  resizeObserver.observe(boardStage.value);
  saveInterval = setInterval(() => {
    if (deckDirty) saveDeckToDb();
  }, 5000);
});

watch(
  () => widgets.value.length,
  (count) => {
    updateWidgetTickerState();
    if (count === 0) {
      widgetSnapshotCache.clear();
      widgetDomRefs.clear();
    }
  },
  { immediate: true },
);

watch(
  () => audacitySyncEnabled.value,
  (enabled) => {
    localStorage.setItem("audacitySyncEnabled", String(enabled));
    audacitySyncWarned = false;
    if (!enabled) {
      stopAudacityHealthTimer();
      audacityRecording.value = false;
      setAudacityStatus(audacityBridgeUrl ? "off" : "missing", "Sync off");
      return;
    }
    startAudacityHealthTimer();
  },
);

watch(routePath, (path) => {
  if (path === "/recordings") {
    loadRecordings();
  }
  if (path === "/class") {
    nextTick(() => {
      resizeCanvases();
      updateDockMetrics();
    });
  } else {
    showSettingsPopover.value = false;
    showSlidesPanel.value = false;
    showPrestart.value = false;
    showWidgetPopover.value = false;
  }
});

watch(
  () => webcam.chromaEnabled,
  (enabled) => {
    if (enabled && webcam.enabled) {
      startWebcamLoop();
    } else if (!enabled) {
      stopWebcamLoop();
    }
  },
);

watch(showShapePopover, (visible) => {
  if (visible) updateShapePopoverSize();
});

watch(shapeTab, () => {
  if (showShapePopover.value) updateShapePopoverSize();
});

watch([liveRelayUrl, liveRtmpUrl, liveStreamKey], () => {
  saveLiveSettings();
});

function handleViewportResize() {
  viewportSize.value = { width: window.innerWidth, height: window.innerHeight };
  updateShapePopoverSize();
}

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  window.removeEventListener("popstate", handlePopstate);
  window.removeEventListener("resize", handleViewportResize);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  stopRecordingLoop();
  stopWebcamLoop();
  stopRecordingTimer();
  stopWidgetTicker();
  onWidgetDragEnd();
  onWidgetResizeEnd();
  stopMicMeter();
  if (isLiveBroadcasting.value) {
    stopLiveBroadcast();
  }
  if (webcam.stream) {
    webcam.stream.getTracks().forEach((track) => track.stop());
  }
  stopMicPreview();
  if (deckDirty) {
    saveDeckToDb();
  }
  recordingUrls.forEach((url) => URL.revokeObjectURL(url));
  recordingUrls.clear();
});
</script>
